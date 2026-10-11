package com.pro.uclfootball.referrals

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.widthIn
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.platform.LocalContext
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
import com.pro.uclfootball.network.ReferralDto
import com.pro.uclfootball.ui.*
import com.pro.uclfootball.network.textValue
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

private enum class ReferralFilter { All, Level1, Level2, Level3 }

@Composable
fun ReferralsRoute(
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectTab: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val viewModel: ReferralsViewModel = viewModel(
        factory = remember(container.referralsRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    ReferralsViewModel(container.referralsRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(viewModel::refresh)
    val context = LocalContext.current
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    var selected by rememberSaveable { mutableStateOf(ReferralFilter.All) }
    val referrals = state.response?.referrals.orEmpty()
    val visible = referrals.filter { item -> selected == ReferralFilter.All || item.level == selected.level() }
    val activeCount = referrals.count { it.isActive == true }
    val levelCounts = (1..3).map { level -> referrals.count { it.level == level } }

    Scaffold(
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 12.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Column {
                    WebPageHeading(webCopy("mobile.referrals.title"), onBack)
                    Text("${webCopy("mobile.referrals.inviteCode")}: ${state.response?.refer ?: webCopy("status.pending")}", Modifier.padding(start = 32.dp), color = WebMuted, fontSize = 12.sp)
                }
            }
            item {
                WebPanel(radius = 8, padding = 12) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ReferralMetric(webCopy("mobile.vip.total"), referrals.size.toString(), Modifier.weight(1f))
                        ReferralMetric(webCopy("status.active"), activeCount.toString(), Modifier.weight(1f))
                        ReferralMetric(webCopy("mobile.transactions.deposits"), webMoney(referrals.sumOf { it.totald.textValue().toDoubleOrNull() ?: 0.0 }), Modifier.weight(1f))
                    }
                }
            }
            item {
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ReferralFilterButton(webCopy("common.all"), referrals.size, selected == ReferralFilter.All) { selected = ReferralFilter.All }
                    listOf(ReferralFilter.Level1, ReferralFilter.Level2, ReferralFilter.Level3).forEachIndexed { i, value ->
                        ReferralFilterButton(webCopy("mobile.referrals.level", "level" to (i + 1)), levelCounts[i], selected == value) { selected = value }
                    }
                }
            }
            item {
                WebPanel(radius = 8, padding = 12) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${webCopy("mobile.referrals.title")}: ${visible.size}", fontSize = 13.sp, color = WebMuted)
                        Text(webMoney(visible.sumOf { it.totald.textValue().toDoubleOrNull() ?: 0.0 }), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            item { androidx.compose.material3.HorizontalDivider(color = UclColors.dashboardLine)
            }
            when {
                state.isLoading && !state.hasContent -> item { ReferralMessage(stringResource(R.string.referrals_loading)) }
                state.error != null && !state.hasContent -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        ReferralMessage(stringResource(if (state.error == ReferralsError.Network) R.string.referrals_error_network else R.string.referrals_error_general))
                        TextButton(onClick = viewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                visible.isEmpty() -> item { WebEmpty(webCopy("emptyStates.noReferrals"), webCopy("emptyStates.referralsComing"), height = 220) }
                else -> items(visible, key = { referral ->
                    scalar(referral.key) ?: scalar(referral.id) ?: "${referral.level}-${referral.username}"
                }) { referral -> ReferralCard(referral) }
            }
        }
    }
}

private fun ReferralFilter.level(): Int? = when (this) {
    ReferralFilter.All -> null
    ReferralFilter.Level1 -> 1
    ReferralFilter.Level2 -> 2
    ReferralFilter.Level3 -> 3
}

@Composable
private fun ReferralMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, color = WebMuted, fontSize = 11.sp)
        Text(value, color = UclColors.ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ReferralFilterButton(label: String, count: Int, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.widthIn(min = 86.dp).height(44.dp),
        contentPadding = PaddingValues(horizontal = 5.dp, vertical = 7.dp),
        shape = RoundedCornerShape(8.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) UclColors.accent else UclColors.surface,
            contentColor = if (selected) Color.White else WebMuted,
        ),
    ) { Text("$label ($count)", fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1) }
}

@Composable
private fun ReferralCard(item: ReferralDto) {
    val level = item.level ?: 1
    val tone = when (level) {
        1 -> Color(0xFFA8C7FF)
        2 -> Color(0xFF87D8FF)
        else -> Color(0xFFF6C56F)
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            androidx.compose.foundation.Image(androidx.compose.ui.res.painterResource(R.drawable.web_referral_member), null, Modifier.size(40.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(item.username ?: stringResource(R.string.referrals_unknown_user), color = UclColors.ink, fontSize = 15.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                    Surface(shape = RoundedCornerShape(6.dp), color = tone) {
                        Text(webCopy("mobile.referrals.level", "level" to level), modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp), color = UclColors.ink, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(webRecordDate(item.joinedAt ?: item.createdAt ?: item.crdate, "\u2014"), color = WebMuted, fontSize = 11.sp)
                    Text(
                        webCopy(if (item.isActive == true) "status.active" else "status.pending"),
                        color = if (item.isActive == true) UclColors.success else WebMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(webMoney(item.totald.textValue().toDoubleOrNull() ?: 0.0).removeSuffix(" MMK"), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                Text("MMK", color = WebMuted, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun referralDeposit(raw: kotlinx.serialization.json.JsonElement?): String {
    if (BuildConfig.CURRENCY_LABEL.isBlank()) return stringResource(R.string.referrals_currency_pending)
    val amount = scalar(raw) ?: return stringResource(R.string.referrals_amount_unavailable)
    return "$amount ${BuildConfig.CURRENCY_LABEL}"
}

private fun shortDate(value: String?): String {
    if (value.isNullOrBlank()) return "—"
    val date = value.substringBefore('T')
    val time = value.substringAfter('T', "").take(5)
    return listOf(date, time).filter(String::isNotBlank).joinToString(" · ")
}

private fun scalar(value: kotlinx.serialization.json.JsonElement?): String? =
    value?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }?.takeIf(String::isNotBlank)

@Composable
private fun ReferralMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = WebMuted) }
}
