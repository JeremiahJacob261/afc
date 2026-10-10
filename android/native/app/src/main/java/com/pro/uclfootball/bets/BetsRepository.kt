package com.pro.uclfootball.bets

import com.pro.uclfootball.network.MyBetResponse
import com.pro.uclfootball.network.MyBetsResponse
import com.pro.uclfootball.network.NativeApiClient
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class BetsRepository(private val apiClient: NativeApiClient) {
    suspend fun getMyBets(): MyBetsResponse =
        apiClient.getJson("api/my-bets", authenticated = true)

    suspend fun getMyBet(betId: String): MyBetResponse {
        require(betId.isNotBlank()) { "A bet ID is required." }
        val encodedId = URLEncoder.encode(betId, StandardCharsets.UTF_8.name())
        return apiClient.getJson("api/my-bet?id=$encodedId", authenticated = true)
    }
}
