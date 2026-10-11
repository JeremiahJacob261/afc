package com.pro.uclfootball.auth

import com.pro.uclfootball.network.NativeApiClient
import com.pro.uclfootball.network.ApiException
import kotlinx.serialization.Serializable

class LoginRepository(
    private val apiClient: NativeApiClient,
    private val authSessionRepository: AuthSessionRepository,
) {
    suspend fun restoreSession(): Boolean {
        return authSessionRepository.restoreLocalSession()
    }

    suspend fun signIn(identity: String, password: String) {
        val normalizedIdentity = identity.filterNot(Char::isWhitespace)
        val email = if (normalizedIdentity.contains('@')) {
            normalizedIdentity
        } else {
            val response = try {
                apiClient.postJson<LoginEmailRequest, LoginEmailResponse>(
                    path = "api/login-email",
                    body = LoginEmailRequest(username = normalizedIdentity),
                )
            } catch (error: ApiException) {
                if (error.httpStatus == 404) throw InvalidLoginCredentialsException()
                throw error
            }
            if (response.status != "success" || response.email.isNullOrBlank()) {
                throw InvalidLoginCredentialsException()
            }
            response.email
        }

        try {
            authSessionRepository.signIn(email, password)
        } catch (error: SupabaseAuthException) {
            if (error.httpStatus == 400 || error.httpStatus == 401) {
                throw InvalidLoginCredentialsException()
            }
            throw error
        }
    }
}

@Serializable
private data class LoginEmailRequest(val username: String)

@Serializable
private data class LoginEmailResponse(
    val status: String,
    val email: String? = null,
    val message: String? = null,
)

class InvalidLoginCredentialsException : Exception()
