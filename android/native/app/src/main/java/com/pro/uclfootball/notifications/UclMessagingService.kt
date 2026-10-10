package com.pro.uclfootball.notifications

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.pro.uclfootball.MainActivity
import com.pro.uclfootball.UclApplication

class UclMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        (application as UclApplication).container.pushManager.tokenChanged(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val container = (application as UclApplication).container
        if (!container.pushManager.permitted() || container.sessionStore.read() == null) return
        // The feed owns localized money copy; never show stale-currency amounts from a push payload.
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("ucl_notification", true)
        }
        val id = (message.messageId ?: message.sentTime.toString()).hashCode()
        val tap = PendingIntent.getActivity(this, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(this, NativePushManager.CHANNEL_ID)
            .setSmallIcon(com.pro.uclfootball.R.drawable.ic_notification)
            .setContentTitle(getString(com.pro.uclfootball.R.string.notifications_title))
            .setContentText(getString(com.pro.uclfootball.R.string.push_new_activity))
            .setContentIntent(tap).setAutoCancel(true).setVisibility(NotificationCompat.VISIBILITY_PRIVATE).build()
        try { NotificationManagerCompat.from(this).notify(id, notification) }
        catch (_: SecurityException) { /* Permission can be revoked between the check and delivery. */ }
    }
}
