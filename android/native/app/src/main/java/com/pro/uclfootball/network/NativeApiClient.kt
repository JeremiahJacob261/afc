package com.pro.uclfootball.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class NativeApiClient(
    private val config: NativeApiConfig,
    private val accessToken: suspend () -> String? = { null },
    @PublishedApi
    internal val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    },
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .writeTimeout(25, TimeUnit.SECONDS)
        .callTimeout(35, TimeUnit.SECONDS)
        .retryOnConnectionFailure(false)
        .build(),
) {
    suspend fun get(path: String, authenticated: Boolean = false): String =
        execute("GET", path, body = null, authenticated = authenticated)

    suspend fun post(path: String, body: String, authenticated: Boolean = false): String =
        execute("POST", path, body = body, authenticated = authenticated)

    suspend fun postWithToken(path: String, body: String, token: String): String {
        require(token.isNotBlank())
        return execute("POST", path, body, authenticated = true, tokenOverride = token)
    }

    suspend inline fun <reified T> getJson(
        path: String,
        authenticated: Boolean = false,
    ): T = json.decodeFromString(get(path, authenticated))

    suspend inline fun <reified Request : Any, reified Response : Any> postJson(
        path: String,
        body: Request,
        authenticated: Boolean = false,
    ): Response = json.decodeFromString(post(path, json.encodeToString(body), authenticated))

    private suspend fun execute(
        method: String,
        path: String,
        body: String?,
        authenticated: Boolean,
        tokenOverride: String? = null,
    ): String {
        val baseUrl = config.apiBaseUrl
            ?: throw IllegalStateException("HTTPS API base URL is not configured.")
        val requestPath = path.trimStart('/')
        require(requestPath.startsWith("api/")) { "Only same-origin /api endpoints are allowed." }
        require(requestPath.split('/').none { it == ".." }) { "Parent path segments are not allowed." }
        val url = baseUrl.resolve(requestPath)
            ?.takeIf { it.isHttps && it.host == baseUrl.host && it.port == baseUrl.port }
            ?: throw IllegalArgumentException("API path did not resolve to the configured HTTPS origin.")

        val token = if (authenticated) {
            (tokenOverride ?: accessToken())?.takeIf(String::isNotBlank)
                ?: throw ApiException(401, ApiError(message = "An authenticated session is required."), null)
        } else {
            null
        }

        val requestBuilder = Request.Builder()
            .url(url)
            .header("Accept", "application/json")

        if (token != null) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        val requestBody = body?.toRequestBody(JSON_MEDIA_TYPE)
        val request = when (method) {
            "GET" -> requestBuilder.get().build()
            "POST" -> requestBuilder.post(requestBody ?: ByteArray(0).toRequestBody(JSON_MEDIA_TYPE)).build()
            else -> error("Unsupported HTTP method: $method")
        }

        return withContext(Dispatchers.IO) {
            val response = try {
                httpClient.newCall(request).execute()
            } catch (error: IOException) {
                throw error
            }

            response.use { result ->
                val responseText = result.body.string()
                if (!result.isSuccessful) {
                    val parsedError = runCatching { json.decodeFromString<ApiError>(responseText) }.getOrNull()
                    throw ApiException(result.code, parsedError, responseText)
                }
                responseText
            }
        }
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}
