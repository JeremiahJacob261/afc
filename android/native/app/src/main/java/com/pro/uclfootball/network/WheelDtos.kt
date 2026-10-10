package com.pro.uclfootball.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class WheelStateResponse(
    val status: String? = null,
    val balance: JsonElement? = null,
    val minimumBalance: JsonElement? = null,
    val eligible: Boolean? = null,
    val canSpin: Boolean? = null,
    val nextSpinAt: String? = null,
    val lastPrize: String? = null,
    val lastAmount: JsonElement? = null,
    val revision: Int,
    val items: List<WheelItemDto>,
)

@Serializable
data class WheelItemDto(
    val id: String? = null,
    val amount: JsonElement? = null,
    val label: String? = null,
    val imageUrl: String? = null,
    val color: String? = null,
)

@Serializable
data class SpinWheelRequest(val revision: Int)

@Serializable
data class SpinWheelResponse(
    val status: String? = null,
    val prizeIndex: Int? = null,
    val prize: String? = null,
    val amount: JsonElement? = null,
    val balance: JsonElement? = null,
    val minimumBalance: JsonElement? = null,
    val eligible: Boolean? = null,
    val canSpin: Boolean? = null,
    val nextSpinAt: String? = null,
    val rewardId: String? = null,
)
