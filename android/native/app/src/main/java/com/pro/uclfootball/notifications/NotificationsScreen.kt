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
import com.pro.uclfootball.ui.UclColors
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
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                TextButton(onClick = onBack, contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp)) {
                    Text(stringResource(R.string.notifications_back), color = UclColors.ink)
                }
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(stringResource(R.string.notifications_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp)
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
                                Text(stringResource(R.string.notifications_title), color = UclColors.ink, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                Text(stringResource(R.string.notifications_count, state.notifications.size), color = UclColors.muted, fontSize = 12.sp)
                            }
                            Surface(shape = RoundedCornerShape(12.dp), color = UclColors.blueSurface) {
                                Icon(painterResource(R.drawable.ic_nav_notifications), contentDescription = null, tint = UclColors.accent, modifier = Modifier.padding(9.dp).size(22.dp))
                            }
                        }
                    }
                }
            }
            when {
                state.isLoading -> item { NotificationMessage(stringResource(R.string.notifications_loading)) }
                state.error != null -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        NotificationMessage(stringResource(if (state.error == NotificationsError.Network) R.string.notifications_error_network else R.string.notifications_error_general))
                        TextButton(onClick = notificationsViewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                state.notifications.isEmpty() -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        NotificationMessage(stringResource(R.string.notifications_empty_title))
                        Text(stringResource(R.string.notifications_empty_message), color = UclColors.muted, fontSize = 13.sp)
                    }
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
        "bonus" -> Color(0xFF286746)
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
        border = BorderStroke(1.dp, accent.copy(alpha = 0.22f)),
    ) {
        Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            Surface(shape = RoundedCornerShape(12.dp), color = accent.copy(alpha = 0.10f)) {
                Box(Modifier.size(42.dp), contentAlignment = Alignment.Center) {
                    Box(Modifier.size(10.dp).background(accent, CircleShape))
                }
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Text(title, modifier = Modifier.weight(1f), color = UclColors.ink, fontSize = 14.sp, lineHeight = 18.sp, fontWeight = FontWeight.Bold)
                    if (item.appNotificationId != null && item.readAt.isNullOrBlank()) {
                        Spacer(Modifier.width(4.dp))
                        Box(Modifier.padding(top = 4.dp).size(7.dp).background(accent, CircleShape))
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(notificationTime(item.timestamp), color = UclColors.muted, fontSize = 11.sp)
                }
                Text(body, color = UclColors.blueInk, fontSize = 13.sp, lineHeight = 19.sp)
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
private fun notificationTitle(item: NotificationDto): String {
    val titleKey = item.titleKey.orEmpty()
    val titleId = when {
        titleKey.endsWith(".rebateBonus") -> R.string.notifications_title_rebate
        titleKey.endsWith(".referralDepositBonus") -> R.string.notifications_title_referral_deposit
        titleKey.endsWith(".bonus") -> R.string.notifications_title_bonus
        titleKey.endsWith(".firstDepositBonus") -> R.string.notifications_title_first_deposit
        titleKey.endsWith(".betWon") -> R.string.notifications_title_bet_won
        titleKey.endsWith(".announcement") -> R.string.notifications_title_announcement
        titleKey.endsWith(".depositUpdate") -> R.string.notifications_title_deposit_update
        titleKey.endsWith(".withdrawalUpdate") -> R.string.notifications_title_withdrawal_update
        titleKey.endsWith(".adminReward") -> R.string.notifications_title_admin_reward
        titleKey.endsWith(".deposit_approved.title") -> R.string.notifications_event_deposit_approved_title
        titleKey.endsWith(".deposit_declined.title") -> R.string.notifications_event_deposit_declined_title
        titleKey.endsWith(".withdrawal_approved.title") -> R.string.notifications_event_withdrawal_approved_title
        titleKey.endsWith(".withdrawal_declined.title") -> R.string.notifications_event_withdrawal_declined_title
        titleKey.endsWith(".company_match_posted.title") -> R.string.notifications_event_match_title
        titleKey.endsWith(".bet_settled.title") -> R.string.notifications_event_bet_title
        titleKey.endsWith(".team_member_joined.title") -> R.string.notifications_event_team_title
        titleKey.endsWith(".test_push.title") -> R.string.notifications_event_test_title
        titleKey.endsWith(".wheel_reward.title") -> R.string.notifications_event_wheel_title
        else -> null
    }
    return titleId?.let { stringResource(it) }
        ?: item.title.takeIf(String::isNotBlank)
        ?: stringResource(R.string.notifications_fallback_title)
}

@Composable
private fun notificationMessage(item: NotificationDto): String {
    val key = item.messageKey.orEmpty()
    val values = remember(item.messageValues) {
        runCatching {
            item.messageValues?.jsonObject?.mapValues { (_, value) ->
                runCatching { value.jsonPrimitive.contentOrNull }.getOrNull() ?: value.toString()
            }.orEmpty()
        }
            .getOrDefault(emptyMap())
    }
    val messageId = when {
        key.endsWith(".rebateBonus") -> R.string.notifications_message_rebate
        key.endsWith(".referralDepositBonus") -> R.string.notifications_message_referral_deposit
        key.endsWith(".bonus") -> R.string.notifications_message_bonus
        key.endsWith(".firstDepositBonus") -> R.string.notifications_message_first_deposit
        key.endsWith(".betWon") -> R.string.notifications_message_bet_won
        key.endsWith(".transactionUpdate") -> R.string.notifications_message_transaction
        key.endsWith(".adminReward") -> R.string.notifications_message_admin_reward
        key.endsWith(".deposit_approved.message") -> R.string.notifications_event_deposit_approved_message
        key.endsWith(".deposit_declined.message") -> R.string.notifications_event_deposit_declined_message
        key.endsWith(".withdrawal_approved.message") -> R.string.notifications_event_withdrawal_approved_message
        key.endsWith(".withdrawal_declined.message") -> R.string.notifications_event_withdrawal_declined_message
        key.endsWith(".company_match_posted.message") -> R.string.notifications_event_match_message
        key.endsWith(".bet_settled.message") -> R.string.notifications_event_bet_message
        key.endsWith(".team_member_joined.message") -> R.string.notifications_event_team_message
        key.endsWith(".test_push.message") -> R.string.notifications_event_test_message
        key.endsWith(".wheel_reward.message") -> R.string.notifications_event_wheel_message
        else -> null
    }
    if (messageId == null) {
        val fallback = item.message?.takeIf(String::isNotBlank) ?: return stringResource(R.string.notifications_empty_message)
        if (Regex("\\b(FCFA|USDT)\\b", RegexOption.IGNORE_CASE).containsMatchIn(fallback)) {
            return stringResource(R.string.notifications_amount_hidden)
        }
        return fallback
    }

    val hasAmount = values.containsKey("amount") && values["amount"].orEmpty().isNotBlank()
    if (hasAmount && BuildConfig.CURRENCY_LABEL.isBlank()) return stringResource(R.string.notifications_amount_hidden)
    val args = notificationArgs(messageId, localizeNotificationValues(values))
    return when (args.size) {
        0 -> stringResource(messageId)
        1 -> stringResource(messageId, args[0])
        2 -> stringResource(messageId, args[0], args[1])
        3 -> stringResource(messageId, args[0], args[1], args[2])
        else -> stringResource(messageId, args[0], args[1], args[2], args[3])
    }
}

@Composable
private fun localizeNotificationValues(values: Map<String, String>): Map<String, String> {
    val localized = values.toMutableMap()
    localized["typeLabel"] = when (values["typeKey"]?.substringAfterLast('.')) {
        "deposit" -> stringResource(R.string.notifications_deposit_type)
        "withdraw" -> stringResource(R.string.notifications_withdrawal_type)
        else -> values["typeLabel"].orEmpty()
    }
    localized["status"] = when (values["statusKey"]?.substringAfterLast('.')) {
        "success" -> stringResource(R.string.notifications_status_success)
        "failed" -> stringResource(R.string.notifications_status_failed)
        "processing" -> stringResource(R.string.notifications_status_processing)
        else -> stringResource(R.string.notifications_status_pending)
    }
    localized["outcome"] = when (values["outcomeKey"]?.substringAfterLast('.')) {
        "won" -> stringResource(R.string.bets_status_won)
        "refunded" -> stringResource(R.string.bets_status_refunded)
        "lost" -> stringResource(R.string.bets_status_lost)
        else -> values["outcome"].orEmpty()
    }
    return localized
}

@Composable
private fun notificationArgs(messageId: Int, values: Map<String, String>): List<String> = when (messageId) {
    R.string.notifications_message_rebate, R.string.notifications_message_referral_deposit -> listOf(amount(values), values["sourceUsername"].orEmpty())
    R.string.notifications_message_bonus, R.string.notifications_message_first_deposit, R.string.notifications_message_bet_won -> listOf(amount(values))
    R.string.notifications_message_transaction -> listOf(
        values["typeLabel"] ?: values["type"].orEmpty(),
        values["amount"].orEmpty(),
        values["method"].orEmpty(),
        values["status"].orEmpty(),
    )
    R.string.notifications_message_admin_reward -> listOf(amount(values), values["method"] ?: "reward")
    R.string.notifications_event_deposit_approved_message,
    R.string.notifications_event_deposit_declined_message,
    R.string.notifications_event_withdrawal_approved_message,
    R.string.notifications_event_withdrawal_declined_message -> listOf(amount(values), values["method"].orEmpty())
    R.string.notifications_event_match_message -> listOf(values["home"].orEmpty(), values["away"].orEmpty())
    R.string.notifications_event_bet_message -> listOf(values["home"].orEmpty(), values["away"].orEmpty(), values["outcome"].orEmpty())
    R.string.notifications_event_team_message -> listOf(values["username"].orEmpty(), values["level"].orEmpty())
    R.string.notifications_event_wheel_message -> listOf(amount(values))
    else -> emptyList()
}

@Composable
private fun amount(values: Map<String, String>): String {
    val raw = values["amount"].orEmpty()
    if (Regex("\\b(FCFA|USDT)\\b", RegexOption.IGNORE_CASE).containsMatchIn(raw)) {
        return stringResource(R.string.notifications_amount_hidden)
    }
    return if (raw.endsWith(BuildConfig.CURRENCY_LABEL)) raw else "$raw ${BuildConfig.CURRENCY_LABEL}".trim()
}

private fun notificationTime(value: String?): String {
    val timestamp = value?.takeIf(String::isNotBlank) ?: return ""
    val date = timestamp.substringBefore('T')
    val time = timestamp.substringAfter('T', "").take(5)
    return listOf(date, time).filter(String::isNotBlank).joinToString(" · ")
}

@Composable
private fun NotificationMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = UclColors.muted) }
}
