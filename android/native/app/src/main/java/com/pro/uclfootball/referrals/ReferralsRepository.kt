package com.pro.uclfootball.referrals

import com.pro.uclfootball.network.MyReferralsResponse
import com.pro.uclfootball.network.NativeApiClient

class ReferralsRepository(private val apiClient: NativeApiClient) {
    suspend fun getReferrals(): MyReferralsResponse = apiClient.getJson("api/my-referrals", authenticated = true)
}
