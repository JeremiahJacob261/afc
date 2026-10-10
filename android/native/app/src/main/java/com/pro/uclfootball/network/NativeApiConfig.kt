package com.pro.uclfootball.network

import android.util.Base64
import com.pro.uclfootball.BuildConfig
import org.json.JSONObject
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

data class NativeApiConfig(
    val apiBaseUrl: HttpUrl?,
    val supabaseUrl: HttpUrl?,
    val supabaseAnonKey: String,
) {
    val isConfigured: Boolean
        get() = apiBaseUrl != null && supabaseUrl != null && supabaseAnonKey.isNotBlank()

    companion object {
        fun fromBuildConfig(): NativeApiConfig = NativeApiConfig(
            apiBaseUrl = BuildConfig.API_BASE_URL.toHttpsUrlOrNull(),
            supabaseUrl = BuildConfig.SUPABASE_URL.toHttpsUrlOrNull(),
            supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY
                .takeUnless(String::isServiceRoleOrSecretKey)
                .orEmpty(),
        )
    }
}

private fun String.toHttpsUrlOrNull(): HttpUrl? =
    trim().takeIf(String::isNotEmpty)
        ?.toHttpUrlOrNull()
        ?.takeIf { it.isHttps && it.username.isEmpty() && it.password.isEmpty() }

private fun String.isServiceRoleOrSecretKey(): Boolean {
    if (startsWith("sb_secret_", ignoreCase = true)) return true
    val payload = split('.').getOrNull(1) ?: return false
    val decoded = runCatching {
        Base64.decode(payload, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
            .toString(Charsets.UTF_8)
    }.getOrNull() ?: return false
    return runCatching { JSONObject(decoded).optString("role") == "service_role" }
        .getOrDefault(false)
}
