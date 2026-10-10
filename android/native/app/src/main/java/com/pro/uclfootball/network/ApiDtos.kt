package com.pro.uclfootball.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class MeResponse(
    val status: String,
    val profile: CustomerProfileDto,
    val referralCount: Int? = null,
    val vip: JsonElement? = null,
    val currency: JsonElement? = null,
    val membershipBalanceThreshold: JsonElement? = null,
)

@Serializable
data class CustomerProfileDto(
    val userid: String? = null,
    val uid: String? = null,
    val username: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val countrycode: String? = null,
    val balance: JsonElement? = null,
    val totald: JsonElement? = null,
    val totalw: JsonElement? = null,
    val newrefer: String? = null,
    val refer: String? = null,
    val lvla: JsonElement? = null,
    val lvlb: JsonElement? = null,
    val firstd: JsonElement? = null,
    val dailywl: JsonElement? = null,
    val codeset: JsonElement? = null,
    val isActive: Boolean? = null,
)

@Serializable
data class MatchesResponse(
    val status: String,
    val matches: List<MatchSummaryDto>,
)

@Serializable
data class MatchSummaryDto(
    val id: JsonElement? = null,
    @SerialName("match_id") val matchId: JsonElement? = null,
    val home: String? = null,
    val away: String? = null,
    val ihome: JsonElement? = null,
    val iaway: JsonElement? = null,
    val league: String? = null,
    val otherl: String? = null,
    val date: String? = null,
    val time: String? = null,
    val tsgmt: JsonElement? = null,
    val company: String? = null,
    val comarket: JsonElement? = null,
    val onenil: JsonElement? = null,
    val oneone: JsonElement? = null,
    val onetwo: JsonElement? = null,
    val verified: Boolean? = null,
    val protectedMarket: JsonElement? = null,
)

@Serializable
data class MatchResponse(
    val status: String,
    val match: MatchDetailDto,
)

@Serializable
data class MatchDetailDto(
    val id: JsonElement? = null,
    @SerialName("match_id") val matchId: JsonElement? = null,
    val home: String? = null,
    val away: String? = null,
    val ihome: JsonElement? = null,
    val iaway: JsonElement? = null,
    val league: String? = null,
    val otherl: String? = null,
    val date: String? = null,
    val time: String? = null,
    val tsgmt: JsonElement? = null,
    val company: String? = null,
    val comarket: JsonElement? = null,
    val verified: Boolean? = null,
    val nilnil: JsonElement? = null,
    val onenil: JsonElement? = null,
    val nilone: JsonElement? = null,
    val oneone: JsonElement? = null,
    val twonil: JsonElement? = null,
    val niltwo: JsonElement? = null,
    val twoone: JsonElement? = null,
    val onetwo: JsonElement? = null,
    val twotwo: JsonElement? = null,
    val threenil: JsonElement? = null,
    val nilthree: JsonElement? = null,
    val threeone: JsonElement? = null,
    val onethree: JsonElement? = null,
    val twothree: JsonElement? = null,
    val threetwo: JsonElement? = null,
    val threethree: JsonElement? = null,
    val otherscores: JsonElement? = null,
    val protectedMarket: JsonElement? = null,
)
