package com.pro.uclfootball.notifications

import com.pro.uclfootball.network.NativeApiClient
import com.pro.uclfootball.network.NotificationDto
import com.pro.uclfootball.network.MarkNotificationsReadRequest
import com.pro.uclfootball.network.MarkNotificationsReadResponse
import com.pro.uclfootball.network.NotificationsSummaryResponse
import kotlinx.serialization.json.JsonElement

class NotificationsRepository(private val apiClient: NativeApiClient) {
    suspend fun getNotifications(): List<NotificationDto> =
        apiClient.getJson("api/notify", authenticated = true)

    suspend fun getSummary(): NotificationsSummaryResponse =
        apiClient.getJson("api/notify?summary=1", authenticated = true)

    suspend fun markRead(id: JsonElement): MarkNotificationsReadResponse =
        apiClient.postJson(
            "api/notify",
            MarkNotificationsReadRequest(ids = listOf(id)),
            authenticated = true,
        )
}
