package com.pro.uclfootball.transactions

import com.pro.uclfootball.network.MyTransactionsResponse
import com.pro.uclfootball.network.NativeApiClient
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class TransactionsRepository(private val apiClient: NativeApiClient) {
    suspend fun getTransactions(type: String = "all", onCached: ((MyTransactionsResponse) -> Unit)? = null): MyTransactionsResponse {
        require(type in setOf("all", "deposit", "withdraw")) { "Unsupported transaction filter." }
        val encodedType = URLEncoder.encode(type, StandardCharsets.UTF_8.name())
        return apiClient.getJson("api/my-transactions?type=$encodedType", authenticated = true, onCached = onCached)
    }
}
