package com.pro.uclfootball.rewards

import com.pro.uclfootball.network.NativeApiClient
import com.pro.uclfootball.network.SpinWheelRequest
import com.pro.uclfootball.network.SpinWheelResponse
import com.pro.uclfootball.network.WheelStateResponse

class WheelRepository(private val apiClient: NativeApiClient) {
    suspend fun getState(onCached: ((WheelStateResponse) -> Unit)? = null): WheelStateResponse = apiClient.getJson("api/wheel-spin", authenticated = true, onCached = onCached)
    suspend fun spin(revision: Int): SpinWheelResponse =
        apiClient.postJson("api/wheel-spin", SpinWheelRequest(revision), authenticated = true)
}
