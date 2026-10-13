package com.pro.uclfootball.auth

import com.pro.uclfootball.network.NativeApiClient
import com.pro.uclfootball.network.NativeApiConfig
import kotlinx.coroutines.runBlocking
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Test

class RegistrationRepositoryTest {
    private val profile = SignupProfileRequest("new_player", "9123456789", "+95", "")

    private fun repository(signupCode: Int, signupBody: String, loginCode: Int = 200): Pair<RegistrationRepository, MutableList<Request>> {
        val requests = mutableListOf<Request>()
        val http = OkHttpClient.Builder().addInterceptor { chain ->
            val request = chain.request()
            requests += request
            val (code, body) = when (request.url.encodedPath) {
                "/api/check-username" -> 200 to """{"status":"success","available":true}"""
                "/auth/v1/signup" -> signupCode to signupBody
                "/auth/v1/token" -> loginCode to if (loginCode == 200)
                    """{"access_token":"recovered-token","refresh_token":"refresh","expires_in":3600}"""
                    else """{"error_code":"invalid_credentials","msg":"Invalid login credentials"}"""
                "/api/mobile/signup-profile" -> 200 to """{"status":"success","newrefer":"1234567"}"""
                else -> error("Unexpected registration request")
            }
            Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(code).message("test")
                .body(body.toResponseBody("application/json".toMediaType())).build()
        }.build()
        val config = NativeApiConfig("https://example.com/".toHttpUrl(), "https://auth.example.com/".toHttpUrl(), "public-test-key")
        return RegistrationRepository(NativeApiClient(config, httpClient = http), SupabaseAuthClient(config, httpClient = http)) to requests
    }

    @Test fun retriesProfileCreationForAnAuthAccountLeftByFailedRegistration() = runBlocking {
        val (repository, requests) = repository(422, """{"error_code":"user_already_exists","msg":"User already registered"}""")
        assertTrue(repository.register("player@example.com", "password123", profile))
        assertEquals(listOf("/api/check-username", "/auth/v1/signup", "/auth/v1/token", "/api/mobile/signup-profile"), requests.map { it.url.encodedPath })
        assertEquals("Bearer recovered-token", requests.last().header("Authorization"))
    }

    @Test fun anExistingEmailCannotBeRecoveredWithoutTheCorrectPassword() = runBlocking {
        val (repository, requests) = repository(422, """{"error_code":"user_already_exists","msg":"User already registered"}""", 400)
        try {
            repository.register("player@example.com", "wrong-password", profile)
            fail("Expected existing email rejection")
        } catch (error: SupabaseAuthException) {
            assertEquals("user_already_exists", error.code)
        }
        assertFalse(requests.any { it.url.encodedPath == "/api/mobile/signup-profile" })
    }

    @Test fun unrelatedAuthFailuresDoNotAttemptRecovery() = runBlocking {
        val (repository, requests) = repository(429, """{"error_code":"over_request_rate_limit","msg":"Too many requests"}""")
        try {
            repository.register("player@example.com", "password123", profile)
            fail("Expected rate limit rejection")
        } catch (error: SupabaseAuthException) {
            assertEquals("over_request_rate_limit", error.code)
        }
        assertEquals(2, requests.size)
    }

    @Test fun freshSignupCreatesProfileWithTheSignupToken() = runBlocking {
        val (repository, requests) = repository(200, """{"access_token":"signup-token"}""")
        assertTrue(repository.register("player@example.com", "password123", profile))
        assertEquals("Bearer signup-token", requests.last().header("Authorization"))
        assertFalse(requests.any { it.url.encodedPath == "/auth/v1/token" })
    }

    @Test fun emailConfirmationDoesNotProvisionBeforeAuthentication() = runBlocking {
        val (repository, requests) = repository(200, """{"user":{"id":"new-user"}}""")
        assertFalse(repository.register("player@example.com", "password123", profile))
        assertEquals(2, requests.size)
        repository.completeAfterConfirmation("player@example.com", "password123", profile)
        assertEquals("Bearer recovered-token", requests.last().header("Authorization"))
    }
}
