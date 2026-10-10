package com.pro.uclfootball.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class MyReferralsResponse(
    val status: String? = null,
    val refer: String? = null,
    val referrals: List<ReferralDto> = emptyList(),
    val membershipBalanceThreshold: JsonElement? = null,
)

@Serializable
data class ReferralDto(
    val id: JsonElement? = null,
    val key: JsonElement? = null,
    val username: String? = null,
    val totald: JsonElement? = null,
    val balance: JsonElement? = null,
    val firstd: Boolean? = null,
    val isActive: Boolean? = null,
    @SerialName("joinedAt") val joinedAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val crdate: String? = null,
    val level: Int? = null,
    val levelLabel: String? = null,
)
