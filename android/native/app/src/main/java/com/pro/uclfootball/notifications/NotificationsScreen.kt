package com.pro.uclfootball.notifications

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.heightIn
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.BuildConfig
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.home.NativeBottomBar
import com.pro.uclfootball.network.NotificationDto
import com.pro.uclfootball.ui.*
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Composable
fun NotificationsRoute(
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectTab: (String) -> Unit,
    onSignInRequired: () -> Unit,
    onOpenMatch: (String) -> Unit,
    onOpenBet: (String) -> Unit,
) {
    val notificationsViewModel: NotificationsViewModel = viewModel(
        factory = remember(container.notificationsRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    NotificationsViewModel(container.notificationsRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by notificationsViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(notificationsViewModel::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }

    Scaffold(
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item { WebPageHeading(webCopy("mobile.notifications.title"), onBack) }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Color(0x3D1BB6FF)),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(webCopy("mobile.notifications.title"), color = UclColors.ink, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                                Text(webCopy("mobile.notifications.count", "count" to state.notifications.size), color = WebMuted, fontSize = 12.sp)
                            }
                            Surface(shape = RoundedCornerShape(12.dp), color = Color(0x1F1BB6FF)) {
                                WebIcon("solar_bell_bold", Modifier.padding(9.dp).size(22.dp), UclColors.accent)
                            }
                        }
                    }
                }
            }
            when {
                state.isLoading && !state.hasContent -> item {
                    Column(Modifier.fillMaxWidth().heightIn(min = 360.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically)) {
                        androidx.compose.material3.CircularProgressIndicator(Modifier.size(28.dp), color = UclColors.accent)
                        Text(webCopy("mobile.notifications.loading"), color = WebMuted, fontSize = 13.sp)
                    }
                }
                state.error != null && !state.hasContent -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        NotificationMessage(stringResource(if (state.error == NotificationsError.Network) R.string.notifications_error_network else R.string.notifications_error_general))
                        TextButton(onClick = notificationsViewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                state.notifications.isEmpty() -> item {
                    WebEmpty(webCopy("emptyStates.noNotifications"), webCopy("emptyStates.notificationsComing"), height = 340, color = UclColors.surface, icon = "solar_bell_off_bold")
                }
                else -> items(state.notifications, key = NotificationDto::id) { item ->
                    NotificationCard(item) {
                        notificationsViewModel.markRead(item)
                        openNotificationDestination(item, onSelectTab, onOpenMatch, onOpenBet)
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(item: NotificationDto, onClick: () -> Unit) {
    val category = item.category.orEmpty().lowercase()
    val accent = when (category) {
        "bonus" -> UclColors.success
        "bet" -> Color(0xFF8A6013)
        "admin" -> Color(0xFF594596)
        "deposit" -> UclColors.accent
        "withdrawal" -> Color(0xFFA43D4A)
        else -> UclColors.blueInk
    }
    val title = notificationTitle(item)
    val body = notificationMessage(item)
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, when (category) { "bonus" -> Color(0x470649FF); "bet" -> Color(0x47F8C14A); "admin" -> Color(0x47C7A6FF); "deposit" -> Color(0x4732D7FF); "withdrawal" -> Color(0x47FF9E7A); else -> Color(0x478CCBFF) }),
    ) {
        Row(Modifier.heightIn(min = 96.dp).padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            Surface(shape = RoundedCornerShape(12.dp), color = when (category) { "bonus" -> Color(0x1F0649FF); "bet" -> Color(0x1FF8C14A); "admin" -> Color(0x1FC7A6FF); "deposit" -> Color(0x1F32D7FF); "withdrawal" -> Color(0x1FFF9E7A); else -> Color(0x1F8CCBFF) }) {
                Box(Modifier.size(42.dp), contentAlignment = Alignment.Center) {
                    WebIcon(when (category) { "bonus" -> "solar_gift_bold"; "bet" -> "solar_football_bold"; "admin" -> "solar_shield_check_bold"; "deposit" -> "solar_wallet_money_bold"; "withdrawal" -> "solar_card_transfer_bold"; else -> "solar_bell_bing_bold" }, Modifier.size(22.dp), accent)
                }
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Text(title, modifier = Modifier.weight(1f), color = UclColors.ink, fontSize = 14.sp, lineHeight = 18.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Text(notificationTime(item.timestamp), color = WebMuted, fontSize = 11.sp, lineHeight = 14.sp)
                }
                Text(body, color = Color(0xFF114690), fontSize = 13.sp, lineHeight = 19.sp)
            }
        }
    }
}

private fun openNotificationDestination(
    item: NotificationDto,
    onSelectTab: (String) -> Unit,
    onOpenMatch: (String) -> Unit,
    onOpenBet: (String) -> Unit,
) {
    val payload = runCatching { item.messageValues?.jsonObject }.getOrNull()
    fun payloadText(key: String): String? = runCatching {
        payload?.get(key)?.jsonPrimitive?.contentOrNull
    }.getOrNull()?.takeIf(String::isNotBlank)
    when (payloadText("route")) {
        "match" -> payloadText("matchId")?.let(onOpenMatch) ?: onSelectTab("matches")
        "bet" -> payloadText("betId")?.let(onOpenBet) ?: onSelectTab("bets")
        "referrals" -> onSelectTab("referrals")
        "wheel" -> onSelectTab("wheel")
        "transactions" -> onSelectTab("transactions")
        "notifications" -> when (item.category?.lowercase()) {
            "deposit", "withdrawal" -> onSelectTab("transactions")
            else -> Unit
        }
        else -> when (item.category?.lowercase()) {
            "bet" -> onSelectTab("bets")
            "deposit", "withdrawal" -> onSelectTab("transactions")
            "bonus" -> if (item.type == "wheel_reward") onSelectTab("wheel") else onSelectTab("referrals")
            "team" -> onSelectTab("referrals")
            "match" -> payloadText("matchId")?.let(onOpenMatch) ?: onSelectTab("matches")
            else -> Unit
        }
    }
}

@Composable
private fun notificationTitle(item: NotificationDto): String =
    item.titleKey?.takeIf(String::isNotBlank)?.let { webCopy(it) }
        ?: item.title.takeIf(String::isNotBlank) ?: webCopy("mobile.notifications.fallbackTitle")

@Composable
private fun notificationMessage(item: NotificationDto): String =
    item.messageKey?.takeIf(String::isNotBlank)?.let { webApiCopy(it, item.messageValues) } ?: item.message.orEmpty()

@Composable
private fun notificationTime(value: String?): String = webRecordDate(value, webCopy("common.justNow"))

@Composable
private fun NotificationMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = WebMuted) }
}
