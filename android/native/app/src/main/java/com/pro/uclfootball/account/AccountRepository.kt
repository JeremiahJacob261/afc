package com.pro.uclfootball.account

import com.pro.uclfootball.network.MeResponse
import com.pro.uclfootball.network.NativeApiClient

class AccountRepository(private val apiClient: NativeApiClient) {
    suspend fun getProfile(onCached: ((MeResponse) -> Unit)? = null): MeResponse = apiClient.getJson("api/me", authenticated = true, onCached = onCached)
}
