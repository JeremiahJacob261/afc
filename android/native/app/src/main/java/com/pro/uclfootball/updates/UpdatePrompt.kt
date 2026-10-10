package com.pro.uclfootball.updates

import android.content.Intent
import android.net.Uri
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import com.pro.uclfootball.BuildConfig
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.Serializable
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

@Serializable
private data class ApkRelease(val applicationId: String, val versionCode: Int,
    val versionName: String = "", val downloadUrl: String = "", val sha256: String = "")

@Composable
fun UpdatePrompt(container: UclAppContainer) {
    val context = LocalContext.current
    var release by remember { mutableStateOf<ApkRelease?>(null) }
    LaunchedEffect(container) {
        if (BuildConfig.FLAVOR != "production") return@LaunchedEffect
        try {
            val result = container.apiClient.getJson<ApkRelease>("api/mobile/release")
            val url = result.downloadUrl.toHttpUrlOrNull()
            val origin = container.apiConfig.apiBaseUrl
            if (result.applicationId == "com.pro.uclfootball" && result.versionCode > BuildConfig.VERSION_CODE &&
                result.versionName.isNotBlank() && result.sha256.matches(Regex("[a-fA-F0-9]{64}")) &&
                url != null && origin != null && url.isHttps && url.host == origin.host && url.port == origin.port &&
                url.username.isEmpty() && url.password.isEmpty() && url.query == null && url.fragment == null &&
                url.encodedPath.endsWith(".apk")) release = result
        } catch (error: CancellationException) { throw error }
        catch (_: Exception) { /* An unavailable update service never interrupts account access. */ }
    }
    release?.let { available ->
        AlertDialog(onDismissRequest = { release = null },
            title = { Text(stringResource(R.string.update_title)) },
            text = { Text(stringResource(R.string.update_message, available.versionName)) },
            confirmButton = { TextButton(onClick = {
                runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(available.downloadUrl))) }
                release = null
            }) { Text(stringResource(R.string.update_download)) } },
            dismissButton = { TextButton(onClick = { release = null }) { Text(stringResource(R.string.update_later)) } })
    }
}
