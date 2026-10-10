package com.pro.uclfootball.auth

import com.pro.uclfootball.network.NativeApiConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import okhttp3.HttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class SupabaseAuthClient(
    private val config: NativeApiConfig,
    private val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    },
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .writeTimeout(25, TimeUnit.SECONDS)
        .callTimeout(35, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build(),
) {
    suspend fun signUp(email: String, password: String): SignupAuthResponse {
        val request = Request.Builder()
            .url(requireSupabaseUrl().endpoint("auth/v1/signup"))
            .header("apikey", requireAnonKey())
            .header("Accept", "application/json")
            .post(json.encodeToString(PasswordGrantRequest(email.trim(), password)).toRequestBody(JSON_MEDIA_TYPE))
            .build()
        return json.decodeFromString(execute(request))
    }

    suspend fun signInWithPassword(email: String, password: String): SupabaseSession {
        require(email.isNotBlank()) { "Email is required." }
        require(password.isNotEmpty()) { "Password is required." }

        val response = postAuth(
            path = "auth/v1/token",
            grantType = "password",
            payload = json.encodeToString(PasswordGrantRequest(email.trim(), password)),
        )
        val session = decodeSession(response)
        require(session.accessToken.isNotBlank() && session.refreshToken.isNotBlank()) {
            "Supabase Auth did not return a complete session."
        }
        return session
    }

    suspend fun refreshSession(refreshToken: String): SupabaseSession {
        require(refreshToken.isNotBlank()) { "Refresh token is required." }

        val response = postAuth(
            path = "auth/v1/token",
            grantType = "refresh_token",
            payload = json.encodeToString(RefreshGrantRequest(refreshToken)),
        )
        val session = decodeSession(response)
        require(session.accessToken.isNotBlank() && session.refreshToken.isNotBlank()) {
            "Supabase Auth did not return a refreshed session."
        }
        return session
    }

    suspend fun signOut(accessToken: String) {
        require(accessToken.isNotBlank()) { "Access token is required." }
        val supabaseUrl = requireSupabaseUrl()
        val request = Request.Builder()
            .url(supabaseUrl.endpoint("auth/v1/logout"))
            .header("apikey", requireAnonKey())
            .header("Authorization", "Bearer $accessToken")
            .post(ByteArray(0).toRequestBody(JSON_MEDIA_TYPE))
            .build()

        execute(request)
    }

    suspend fun sendPasswordRecovery(email: String, redirectUrl: String) {
        require(email.isNotBlank()) { "Email is required." }
        require(redirectUrl.isNotBlank()) { "Recovery redirect URL is required." }
        val url = requireSupabaseUrl().endpoint("auth/v1/recover")
            .newBuilder()
            .addQueryParameter("redirect_to", redirectUrl)
            .build()
        val request = Request.Builder()
            .url(url)
            .header("apikey", requireAnonKey())
            .header("Accept", "application/json")
            .post(json.encodeToString(PasswordRecoveryRequest(email.trim())).toRequestBody(JSON_MEDIA_TYPE))
            .build()
        execute(request)
    }

    suspend fun updatePassword(recoveryAccessToken: String, newPassword: String) {
        require(recoveryAccessToken.isNotBlank()) { "Recovery session is required." }
        require(newPassword.isNotBlank()) { "New password is required." }
        val request = Request.Builder()
            .url(requireSupabaseUrl().endpoint("auth/v1/user"))
            .header("apikey", requireAnonKey())
            .header("Authorization", "Bearer $recoveryAccessToken")
            .header("Accept", "application/json")
            .put(json.encodeToString(PasswordUpdateRequest(newPassword)).toRequestBody(JSON_MEDIA_TYPE))
            .build()
        execute(request)
    }

    private suspend fun postAuth(path: String, grantType: String, payload: String): String {
        val request = Request.Builder()
            .url(requireSupabaseUrl().endpoint(path, grantType))
            .header("apikey", requireAnonKey())
            .header("Accept", "application/json")
            .post(payload.toRequestBody(JSON_MEDIA_TYPE))
            .build()
        return execute(request)
    }

    private suspend fun execute(request: Request): String = withContext(Dispatchers.IO) {
        val response = try {
            httpClient.newCall(request).execute()
        } catch (error: IOException) {
            throw error
        }

        response.use { result ->
            val body = result.body.string()
            if (!result.isSuccessful) {
                val authError = runCatching { json.decodeFromString<SupabaseAuthError>(body) }.getOrNull()
                throw SupabaseAuthException(
                    httpStatus = result.code,
                    code = authError?.error,
                    message = authError?.errorDescription ?: authError?.msg ?: authError?.message,
                )
            }
            body
        }
    }

    private fun decodeSession(response: String): SupabaseSession =
        try {
            json.decodeFromString(response)
        } catch (error: SerializationException) {
            throw SupabaseAuthException(
                httpStatus = null,
                code = "invalid_session_response",
                message = error.message,
            )
        }

    private fun requireSupabaseUrl(): HttpUrl =
        config.supabaseUrl ?: throw IllegalStateException("HTTPS Supabase URL is not configured.")

    private fun requireAnonKey(): String = config.supabaseAnonKey
        .takeIf(String::isNotBlank)
        ?: throw IllegalStateException("Supabase public anon key is not configured.")

    private fun HttpUrl.endpoint(path: String, grantType: String? = null): HttpUrl {
        val builder = newBuilder().addPathSegments(path)
        if (grantType != null) builder.addQueryParameter("grant_type", grantType)
        return builder.build()
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}

@kotlinx.serialization.Serializable
private data class PasswordRecoveryRequest(val email: String)

@kotlinx.serialization.Serializable
private data class PasswordUpdateRequest(val password: String)

class SupabaseAuthException(
    val httpStatus: Int?,
    val code: String?,
    override val message: String?,
) : Exception(message ?: "Supabase authentication failed.")
