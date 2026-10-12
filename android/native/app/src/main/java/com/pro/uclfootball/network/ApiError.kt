package com.pro.uclfootball.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

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
) : Exception(apiError?.message ?: responseMessage(responseBody) ?: "Request failed (${httpStatus})") {
    /** Some legacy endpoints return an array of result objects even for HTTP errors. */
    val failure: ApiError? = apiError ?: responseFailure(responseBody)
}

private fun responseMessage(body: String?): String? = responseFailure(body)?.message

private fun responseFailure(body: String?): ApiError? = runCatching {
    val root = Json.parseToJsonElement(body ?: return null)
    val error = if (root is JsonArray) root.firstOrNull() else root
    val fields = error as? JsonObject ?: return null
    val message = fields["message"]?.jsonPrimitive?.contentOrNull
    val code = fields["code"]?.jsonPrimitive?.contentOrNull
    if (message == null && code == null) null else ApiError(message = message, code = code)
}.getOrNull()
