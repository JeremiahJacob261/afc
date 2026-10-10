package com.pro.uclfootball.auth

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class SupabaseSession(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expires_in") val expiresInSeconds: Long,
    @SerialName("token_type") val tokenType: String = "bearer",
    @SerialName("expires_at") val expiresAtEpochSeconds: Long? = null,
    val user: SupabaseUser? = null,
)

@Serializable
data class SupabaseUser(
    val id: String,
    val email: String? = null,
    @SerialName("user_metadata") val userMetadata: JsonObject? = null,
)

@Serializable
internal data class PasswordGrantRequest(
    val email: String,
    val password: String,
)

@Serializable
internal data class RefreshGrantRequest(
    @SerialName("refresh_token") val refreshToken: String,
)

@Serializable
internal data class SupabaseAuthError(
    val error: String? = null,
    @SerialName("error_description") val errorDescription: String? = null,
    val msg: String? = null,
    val message: String? = null,
)
