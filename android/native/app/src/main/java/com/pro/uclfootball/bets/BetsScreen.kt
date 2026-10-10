package com.pro.uclfootball.bets

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
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
import com.pro.uclfootball.ui.UclColors
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

private enum class BetTab { Unsettled, Settled }

@Composable
fun BetsRoute(
    container: UclAppContainer,
    selectedTab: String,
    onSelectTab: (String) -> Unit,
    onOpenBet: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val betsViewModel: BetsViewModel = viewModel(
        factory = remember(container.betsRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    BetsViewModel(container.betsRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by betsViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(betsViewModel::refresh)
    if (state.requiresSignIn) {
        androidx.compose.runtime.LaunchedEffect(Unit) { onSignInRequired() }
    }
    var tab by rememberSaveable { mutableStateOf(BetTab.Unsettled) }
    val bets = if (tab == BetTab.Unsettled) state.unsettled else state.settled
    val allBets = state.unsettled + state.settled
    val winCount = state.settled.count { bet ->
        bet.settlementOutcome?.let { it.equals("won", true) } ?: bet.won.equals("true", true)
    }
    val refundCount = state.settled.count { it.settlementOutcome.equals("refunded", true) }

    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar(selectedTab, onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 20.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(stringResource(R.string.nav_bets).uppercase(), color = UclColors.muted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(stringResource(R.string.bets_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp)
                }
            }
            if (!state.isLoading && state.error == null) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        BetMetric(stringResource(R.string.bets_metric_unsettled), state.unsettled.size.toString(), Modifier.weight(1f))
                        BetMetric(stringResource(R.string.bets_metric_wins), winCount.toString(), Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        BetMetric(stringResource(R.string.bets_metric_refunds), refundCount.toString(), Modifier.weight(1f))
                        BetMetric(stringResource(R.string.bets_metric_total), allBets.size.toString(), Modifier.weight(1f))
                    }
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    BetTabButton(stringResource(R.string.bets_tab_unsettled), tab == BetTab.Unsettled, Modifier.weight(1f)) { tab = BetTab.Unsettled }
                    BetTabButton(stringResource(R.string.bets_tab_settled), tab == BetTab.Settled, Modifier.weight(1f)) { tab = BetTab.Settled }
                }
            }

            when {
                state.isLoading -> item { BetMessage(stringResource(R.string.bets_loading)) }
                state.error != null -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        BetMessage(stringResource(if (state.error == BetsError.Network) R.string.bets_error_network else R.string.bets_error_general))
                        TextButton(onClick = betsViewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                bets.isEmpty() -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        BetMessage(stringResource(R.string.bets_empty_title))
                        Text(stringResource(R.string.bets_empty_message), color = UclColors.muted)
                    }
                }
                else -> items(bets, key = { bet -> bet.betId ?: scalar(bet.id) ?: "${bet.matchId}-${bet.date}-${bet.time}-${bet.hashCode()}" }) { bet ->
                    BetCard(bet = bet, onClick = {
                        (bet.betId ?: scalar(bet.id))?.let(onOpenBet)
                    })
                }
            }
        }
    }
}

@Composable
private fun BetMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = UclColors.blueSurface,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(value, color = UclColors.ink, fontWeight = FontWeight.Bold, fontSize = 21.sp)
            Text(label, color = UclColors.muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun BetTabButton(label: String, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.height(46.dp),
        shape = RoundedCornerShape(24.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) UclColors.accent else Color.White,
            contentColor = if (selected) Color.White else UclColors.ink,
        ),
        border = if (selected) null else BorderStroke(1.dp, UclColors.dashboardLine),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
    ) { Text(label, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun BetMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = UclColors.muted) }
}

@Composable
private fun BetCard(bet: PlacedBetDto, onClick: () -> Unit) {
    val statusId = when (bet.settlementOutcome?.lowercase()) {
        "won" -> R.string.bets_status_won
        "refunded" -> R.string.bets_status_refunded
        "lost" -> R.string.bets_status_lost
        else -> when {
            bet.won.equals("true", true) -> R.string.bets_status_won
            bet.won.equals("false", true) -> R.string.bets_status_lost
            bet.started == false -> R.string.bets_status_not_started
            bet.started == true -> R.string.bets_status_ongoing
            else -> R.string.bets_status_processing
        }
    }
    val id = bet.betId ?: scalar(bet.id)
    Card(
        modifier = Modifier.fillMaxWidth().clickable(enabled = id != null, onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(stringResource(statusId), color = if (statusId == R.string.bets_status_won) Color(0xFF286746) else UclColors.blueInk, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Text(bet.market?.takeIf(String::isNotBlank) ?: stringResource(R.string.bets_market_unknown), color = UclColors.muted, fontSize = 12.sp)
            }
            Text(
                text = "${bet.home?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_home_team)}  vs  ${bet.away?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_away_team)}",
                color = UclColors.ink,
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp,
            )
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                BetValue(stringResource(R.string.bets_stake), bet.stake, Modifier.weight(1f))
                BetValue(stringResource(R.string.bets_profit), bet.profit, Modifier.weight(1f))
                BetValue(stringResource(R.string.bets_odds), bet.odd, Modifier.weight(1f), useCurrency = false)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(stringResource(R.string.bets_id, id ?: stringResource(R.string.bets_id_unavailable)), color = UclColors.muted, fontSize = 12.sp)
                Text(stringResource(R.string.bets_open_details), color = UclColors.accent, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun BetValue(
    label: String,
    raw: kotlinx.serialization.json.JsonElement?,
    modifier: Modifier = Modifier,
    useCurrency: Boolean = true,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(label, color = UclColors.muted, fontSize = 11.sp)
        val value = scalar(raw)
        if (value == null) {
            Text("—", color = UclColors.ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        } else if (useCurrency && com.pro.uclfootball.BuildConfig.CURRENCY_LABEL.isBlank()) {
            Text(stringResource(R.string.bets_amount_hidden), color = UclColors.ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        } else if (useCurrency) {
            Text(stringResource(R.string.bets_amount_value, value, com.pro.uclfootball.BuildConfig.CURRENCY_LABEL), color = UclColors.ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        } else {
            Text(value, color = UclColors.ink, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        }
    }
}

internal fun scalar(value: kotlinx.serialization.json.JsonElement?): String? =
    value?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }?.takeIf(String::isNotBlank)
