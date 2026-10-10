package com.pro.uclfootball.help

import android.content.Intent
import android.net.Uri
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.ui.*
import com.pro.uclfootball.network.NativeApiClient
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable private data class PlatformSettingsResponse(val status: String, val links: PlatformLinks)
@Serializable private data class PlatformLinks(val customerSupportUrl: String? = null, val telegramGroupUrl: String? = null, val whatsappGroupUrl: String? = null)

@Composable
fun SupportRoute(container: UclAppContainer, onBack: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var links by remember { mutableStateOf<PlatformLinks?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<Int?>(null) }
    val load: () -> Unit = {
        scope.launch {
            busy = true; error = null
            try { links = container.apiClient.getJson<PlatformSettingsResponse>("api/platform-settings").links }
            catch (e: CancellationException) { throw e }
            catch (e: Exception) { error = R.string.journey_offline }
            finally { busy = false }
        }
    }
    LaunchedEffect(Unit) { load() }
    JourneyPage(stringResource(R.string.journey_support), onBack) {
        JourneyFeedback(error)
        if (busy) CircularProgressIndicator()
        listOf(R.string.journey_contact_support to links?.customerSupportUrl,
            R.string.journey_telegram to links?.telegramGroupUrl, R.string.journey_whatsapp to links?.whatsappGroupUrl).forEach { (label, url) ->
            val uri = url?.let(Uri::parse)?.takeIf { it.scheme == "https" && !it.host.isNullOrBlank() && it.userInfo == null }
            JourneyAction(stringResource(label), enabled = uri != null) {
                runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, uri)) }.onFailure { error = R.string.journey_unavailable }
            }
        }
        JourneyAction(stringResource(R.string.common_retry), busy = busy, onClick = load)
    }
}
