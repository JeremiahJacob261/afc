package com.pro.uclfootball.bets

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.home.NativeBottomBar
import com.pro.uclfootball.network.PlacedBetDto
import com.pro.uclfootball.ui.*
import com.pro.uclfootball.network.textValue
import com.pro.uclfootball.network.MatchDetailDto
import androidx.compose.material3.HorizontalDivider
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.platform.LocalConfiguration

@Composable
fun BetDetailRoute(
    betId: String,
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectTab: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val detailViewModel: BetDetailViewModel = viewModel(
        key = "bet-$betId",
        factory = remember(betId, container.betsRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    BetDetailViewModel(betId, container.betsRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by detailViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(detailViewModel::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    LaunchedEffect(state.notFound) { if (state.notFound) onBack() }
    Scaffold(
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
        bottomBar = { NativeBottomBar("bets", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item { BulletinHeading(webCopy("mobile.bets.details"), onBack) }
            if (state.error != null && state.hasContent) item { BulletinRefreshNotice(detailViewModel::refresh) }
            when {
                state.isLoading && !state.hasContent -> item { BetDetailMessage(stringResource(R.string.bets_loading)) }
                state.error != null && !state.hasContent -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        BetDetailMessage(stringResource(if (state.error == BetDetailError.Network) R.string.bets_error_network else R.string.bets_error_general))
                        TextButton(onClick = detailViewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                state.response != null -> item { BetDetailCard(state.response!!.bet, state.response!!.match) }
            }
        }
    }
}

@Composable
internal fun BetDetailCard(bet: PlacedBetDto, match: MatchDetailDto?) {
    val outcome = betOutcome(bet)
    val start = matchStartMillis(bet.tsgmt, bet.matchDate ?: bet.date, bet.matchTime ?: bet.time)
    val date = start?.let { java.text.SimpleDateFormat("dd MMM yyyy, HH:mm", LocalConfiguration.current.locales[0]).format(java.util.Date(it)) } ?: webCopy("common.timeToBeConfirmed")
    Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
        Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surface, border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
            Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text((if (match?.league == "others") match.otherl else match?.league) ?: "—", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                BulletinTeam(bet.home, bet.ihome, large = true); BulletinTeam(bet.away, bet.iaway, large = true)
                BulletinBetBadge(bet)
            }
        }
        BulletinSection(webCopy("mobile.bets.pick")) {
            Text(bet.market ?: "—", fontFamily = WebInter, fontSize = 32.sp, fontWeight = FontWeight.Bold)
            BulletinFact(webCopy("mobile.bets.kickoff"), date)
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            BulletinFact(webCopy("mobile.bets.betId"), bet.betId.orEmpty())
        }
        BulletinSection(webCopy("bulletin.financialBreakdown")) {
            BulletinFact(webCopy("mobile.bets.odds"), String.format(java.util.Locale.ROOT, "%.3f%%", bet.odd.textValue().toDoubleOrNull() ?: 0.0))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            BulletinFact(webCopy("mobile.bets.stake"), webMoney(bet.stake.textValue().toDoubleOrNull() ?: 0.0))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            BulletinFact(webCopy("mobile.match.profit"), webMoney(if (outcome == "refunded") 0.0 else bet.profit.textValue().toDoubleOrNull() ?: 0.0))
            BulletinFact(webCopy(if (outcome == "refunded") "bulletin.stakeReturned" else "bulletin.potentialReturn"), webMoney(betPotentialReturn(bet)), total = true)
            if (outcome == "refunded") Text(webCopy("bulletin.refundExplanation"), Modifier.padding(top = 16.dp), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
        }
    }
}

@Composable private fun BetSectionTitle(title: String, icon: String) {
    Row(Modifier.padding(bottom = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) { WebIcon(icon, tint = UclColors.accent); Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold) }
    HorizontalDivider(color = UclColors.dashboardLine)
}
@Composable private fun BetDetailValue(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f), color = WebMuted, fontSize = 11.sp)
        Text(value, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, textAlign = androidx.compose.ui.text.style.TextAlign.End, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
    }
}

@Composable
private fun BetDetailMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = WebMuted) }
}

@Composable
private fun money(raw: kotlinx.serialization.json.JsonElement?, useCurrency: Boolean = true): String {
    val value = scalar(raw) ?: return "—"
    return if (useCurrency) {
        com.pro.uclfootball.BuildConfig.CURRENCY_LABEL.takeIf(String::isNotBlank)?.let { "$value $it" }
            ?: stringResource(R.string.bets_amount_hidden)
    } else value
}
