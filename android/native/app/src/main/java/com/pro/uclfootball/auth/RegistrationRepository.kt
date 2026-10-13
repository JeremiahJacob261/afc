package com.pro.uclfootball.auth

import com.pro.uclfootball.network.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable data class SignupAuthResponse(
    val user: SupabaseUser? = null, @SerialName("access_token") val accessToken: String? = null,
)
@Serializable private data class UsernameCheckRequest(val username: String)
@Serializable private data class UsernameCheckResponse(val status: String, val available: Boolean)
@Serializable data class SignupProfileRequest(val username: String, val phone: String, val countrycode: String, val refer: String)

class RegistrationRepository(private val api: NativeApiClient, private val auth: SupabaseAuthClient) {
    suspend fun register(email: String, password: String, profile: SignupProfileRequest): Boolean {
        val available = api.postJson<UsernameCheckRequest, UsernameCheckResponse>("api/check-username", UsernameCheckRequest(profile.username))
        if (!available.available) throw UsernameUnavailable()
        val response = try {
            auth.signUp(email, password)
        } catch (error: SupabaseAuthException) {
            if (error.code !in setOf("user_already_exists", "email_exists") &&
                !error.message.orEmpty().contains("already registered", ignoreCase = true)) throw error
            // A failed profile request can leave a valid Auth account behind. Require
            // its password before retrying the idempotent, authenticated profile API.
            val session = try {
                auth.signInWithPassword(email, password)
            } catch (loginError: SupabaseAuthException) {
                if (loginError.code == "invalid_credentials") throw error
                throw loginError
            }
            createProfile(session.accessToken, profile)
            return true
        }
        val token = response.accessToken?.takeIf(String::isNotBlank) ?: return false
        createProfile(token, profile)
        return true
    }
    suspend fun completeAfterConfirmation(email: String, password: String, profile: SignupProfileRequest) {
        // Hold an incomplete profile session only in memory; Login still requires a provisioned profile.
        val session = auth.signInWithPassword(email, password)
        createProfile(session.accessToken, profile)
    }
    private suspend fun createProfile(token: String, profile: SignupProfileRequest) {
        val json = Json { ignoreUnknownKeys = true }
        val result = json.decodeFromString<JourneyResult>(api.postWithToken("api/mobile/signup-profile", json.encodeToString(profile), token))
        check(result.status == "success")
    }
}
class UsernameUnavailable : Exception()
