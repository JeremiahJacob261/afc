package com.pro.uclfootball.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import com.pro.uclfootball.BuildConfig
import com.pro.uclfootball.UclAppContainer
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.util.Locale
import java.util.UUID
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class NativePushManager(private val context: Context, private val container: UclAppContainer) {
    private val preferences = context.getSharedPreferences("native_push", Context.MODE_PRIVATE)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mutex = Mutex()
    val configured: Boolean get() = FirebaseApp.getApps(context).isNotEmpty()

    init {
        if (listOf(BuildConfig.FIREBASE_APP_ID, BuildConfig.FIREBASE_API_KEY,
                BuildConfig.FIREBASE_PROJECT_ID, BuildConfig.FIREBASE_SENDER_ID).all(String::isNotBlank)) {
            if (FirebaseApp.getApps(context).isEmpty()) FirebaseApp.initializeApp(context,
                FirebaseOptions.Builder().setApplicationId(BuildConfig.FIREBASE_APP_ID)
                    .setApiKey(BuildConfig.FIREBASE_API_KEY).setProjectId(BuildConfig.FIREBASE_PROJECT_ID)
                    .setGcmSenderId(BuildConfig.FIREBASE_SENDER_ID).build())
        }
        if (Build.VERSION.SDK_INT >= 26) {
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(
                NotificationChannel(CHANNEL_ID, context.getString(com.pro.uclfootball.R.string.notifications_title),
                    NotificationManager.IMPORTANCE_DEFAULT))
        }
    }

    fun permitted(): Boolean = NotificationManagerCompat.from(context).areNotificationsEnabled() &&
        (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context,
            Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)

    fun synchronize() { scope.launch { synchronizeNow() } }

    private suspend fun synchronizeNow() = mutex.withLock {
        if (!configured || !permitted() || container.authSessionRepository.currentSession() == null) return@withLock
        try {
            val messaging = FirebaseMessaging.getInstance()
            messaging.isAutoInitEnabled = true
            val token = messaging.token.awaitResult()
            register(token)
        } catch (error: CancellationException) { throw error }
        catch (_: Exception) { /* Retry on the next foreground/sign-in/token refresh. */ }
    }

    fun tokenChanged(token: String) {
        scope.launch {
            mutex.withLock {
                if (!permitted() || container.authSessionRepository.currentSession() == null) return@withLock
                try { register(token) }
                catch (error: CancellationException) { throw error }
                catch (_: Exception) { /* Foreground synchronization retries the current token. */ }
            }
        }
    }

    private suspend fun register(token: String) {
        val userId = container.authSessionRepository.currentSession()?.user?.id ?: return
        val deviceId = preferences.getString("device_id", null) ?: UUID.randomUUID().toString().also {
            preferences.edit().putString("device_id", it).apply()
        }
        val language = if (Locale.getDefault().language == "en") "en" else "my"
        if (preferences.getString("registered_token", null) == token &&
            preferences.getString("registered_user", null) == userId &&
            preferences.getString("registered_language", null) == language) return
        val body = buildJsonObject {
            put("token", token); put("platform", "android-native"); put("deviceId", deviceId); put("language", language)
        }.toString()
        container.apiClient.post("api/push/register-token", body, authenticated = true)
        preferences.edit().putString("registered_token", token).putString("registered_user", userId)
            .putString("registered_language", language).apply()
    }

    suspend fun unregister() = mutex.withLock {
        if (!configured) return@withLock
        FirebaseMessaging.getInstance().isAutoInitEnabled = false
        val token = preferences.getString("registered_token", null)
        withTimeoutOrNull(8_000) {
            try {
                if (token != null) container.apiClient.post("api/push/unregister-token",
                    buildJsonObject { put("token", token) }.toString(), authenticated = true)
            } catch (error: CancellationException) { throw error }
            catch (_: Exception) { /* Delete the local FCM token as a second revocation path. */ }
        }
        withTimeoutOrNull(8_000) {
            try { FirebaseMessaging.getInstance().deleteToken().awaitResult() }
            catch (error: CancellationException) { throw error }
            catch (_: Exception) { /* Offline device revocation must also be enforced server-side. */ }
        }
        preferences.edit().remove("registered_token").remove("registered_user").remove("registered_language").apply()
        NotificationManagerCompat.from(context).cancelAll()
    }

    companion object { const val CHANNEL_ID = "efc_updates" }
}

private suspend fun <T> com.google.android.gms.tasks.Task<T>.awaitResult(): T =
    suspendCancellableCoroutine { continuation ->
        addOnCompleteListener { task ->
            if (continuation.isActive) {
                if (task.isSuccessful) continuation.resume(task.result)
                else continuation.resumeWithException(task.exception ?: IllegalStateException("Firebase task failed"))
            }
        }
    }
