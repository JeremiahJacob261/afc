package com.pro.uclfootball.network

import kotlinx.serialization.Serializable

@Serializable
data class ApiError(
    val status: String? = null,
    val message: String? = null,
    val code: String? = null,
)

class ApiException(
    val httpStatus: Int,
    val apiError: ApiError?,
    val responseBody: String?,
) : Exception(apiError?.message ?: "Request failed (${httpStatus})")
