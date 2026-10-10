package com.pro.uclfootball.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/** Normalized union returned by GET /api/notify. Optional fields vary by source. */
@Serializable
data class NotificationDto(
    val id: String,
    val appNotificationId: JsonElement? = null,
    val type: String,
    val title: String,
    val titleKey: String? = null,
    val message: String? = null,
    val messageKey: String? = null,
    val messageValues: JsonElement? = null,
    val amount: JsonElement? = null,
    val sourceUsername: String? = null,
    val timestamp: String? = null,
    val readAt: String? = null,
    val category: String? = null,
    val sourceTable: String? = null,
    val sourceId: JsonElement? = null,
)

/** GET /api/notify?summary=1 has a different envelope from the default route. */
@Serializable
data class NotificationsSummaryResponse(
    val notifications: List<NotificationDto> = emptyList(),
    val unreadCount: Int,
)

@Serializable
data class MarkNotificationsReadRequest(
    val action: String = "mark-read",
    val ids: List<JsonElement>? = null,
)

@Serializable
data class MarkNotificationsReadResponse(
    val status: String,
)
