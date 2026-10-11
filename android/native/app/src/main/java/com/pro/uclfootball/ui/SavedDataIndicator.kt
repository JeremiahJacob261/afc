package com.pro.uclfootball.ui

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pro.uclfootball.UclApplication
import java.text.DateFormat
import java.util.Date

/** Status belongs to the currently visible page, rather than the latest unrelated API request. */
@Composable
fun SavedDataIndicator(route: String) {
    val application = LocalContext.current.applicationContext as? UclApplication ?: return
    val statuses by application.container.apiClient.cacheStatus.collectAsStateWithLifecycle()
    val endpoints = when {
        route == "home" || route == "matches" -> listOf("api/me", "api/my-bets", "api/mobile/matches")
        route == "account" || route == "vip" -> listOf("api/me")
        route == "bets" -> listOf("api/my-bets")
        route.startsWith("bet/") -> listOf("api/my-bet?")
        route == "transactions" -> listOf("api/my-transactions")
        route == "notifications" -> listOf("api/notify")
        route == "referrals" -> listOf("api/my-referrals")
        route == "wheel" -> listOf("api/wheel-spin")
        route.startsWith("match/") -> listOf("api/mobile/match?", "api/me")
        route in listOf("wallet", "deposit", "withdraw", "bind-wallet", "pin") -> listOf("api/mobile/payment-data", "api/me")
        else -> emptyList()
    }
    val saved = statuses.filter { (path, status) -> endpoints.any(path::startsWith) && status.fromCache && status.savedAt != null }.values
    val oldest = saved.minOfOrNull { it.savedAt!! } ?: return
    val locale = LocalConfiguration.current.locales[0]
    val date = remember(oldest, locale) { DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT, locale).format(Date(oldest)) }
    val text = if (locale.language == "my") "သိမ်းထားသောဒေတာ · နောက်ဆုံးအပ်ဒိတ် $date" else "Saved data · last updated $date"
    Text(text, color = UclColors.muted, fontSize = 11.sp,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp))
}
