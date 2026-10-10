package com.pro.uclfootball.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/** Repository-backed shape for the existing authenticated bet-history endpoints.
 * Amounts and settlement fields stay opaque until their deployed schema and
 * launch-currency semantics are approved; clients must not calculate balances.
 */
@Serializable
data class MyBetsResponse(
    val status: String,
    val unsettled: List<PlacedBetDto> = emptyList(),
    val settled: List<PlacedBetDto> = emptyList(),
)

@Serializable
data class MyBetResponse(
    val status: String,
    val bet: PlacedBetDto,
    val match: MatchDetailDto? = null,
)

@Serializable
data class PlacedBetDto(
    val id: JsonElement? = null,
    @SerialName("betid") val betId: String? = null,
    val username: String? = null,
    @SerialName("match_id") val matchId: String? = null,
    val home: String? = null,
    val away: String? = null,
    val ihome: String? = null,
    val iaway: String? = null,
    val stake: JsonElement? = null,
    val aim: JsonElement? = null,
    val profit: JsonElement? = null,
    val market: String? = null,
    val odd: JsonElement? = null,
    val won: String? = null,
    @SerialName("settlement_outcome") val settlementOutcome: String? = null,
    val started: Boolean? = null,
    val levelone: String? = null,
    val leveltwo: String? = null,
    val levelthree: String? = null,
    val aone: JsonElement? = null,
    val atwo: JsonElement? = null,
    val athree: JsonElement? = null,
    val date: String? = null,
    val time: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
    val tsgmt: JsonElement? = null,
    @SerialName("match_date") val matchDate: String? = null,
    @SerialName("match_time") val matchTime: String? = null,
)
