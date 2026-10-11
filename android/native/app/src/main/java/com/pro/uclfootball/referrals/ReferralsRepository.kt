package com.pro.uclfootball.referrals

import com.pro.uclfootball.network.MyReferralsResponse
import com.pro.uclfootball.network.NativeApiClient

class ReferralsRepository(private val apiClient: NativeApiClient) {
    suspend fun getReferrals(onCached: ((MyReferralsResponse) -> Unit)? = null): MyReferralsResponse = apiClient.getJson("api/my-referrals", authenticated = true, onCached = onCached)
}
