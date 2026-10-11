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
import androidx.compose.foundation.layout.heightIn
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
import com.pro.uclfootball.ui.*
import com.pro.uclfootball.network.textValue
import androidx.compose.foundation.background
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
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
        bottomBar = { NativeBottomBar(selectedTab, onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 20.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item { WebPageHeading(webCopy("common.myBets"), { onSelectTab("home") }, bordered = true) }
            if (state.hasContent) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        BetMetric(webCopy("status.unsettled"), state.unsettled.size.toString(), Modifier.weight(1f))
                        BetMetric(webCopy("status.won"), winCount.toString(), Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        BetMetric(webCopy("status.refunded"), refundCount.toString(), Modifier.weight(1f))
                        BetMetric(webCopy("mobile.bets.stake"), webMoney(allBets.sumOf { it.stake.textValue().toDoubleOrNull() ?: 0.0 }), Modifier.weight(1f))
                    }
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().background(UclColors.surface, RoundedCornerShape(8.dp)).padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    BetTabButton(webCopy("status.unsettled"), tab == BetTab.Unsettled, Modifier.weight(1f)) { tab = BetTab.Unsettled }
                    BetTabButton(webCopy("status.settled"), tab == BetTab.Settled, Modifier.weight(1f)) { tab = BetTab.Settled }
                }
            }

            when {
                state.isLoading && !state.hasContent -> item { BetMessage(stringResource(R.string.bets_loading)) }
                state.error != null && !state.hasContent -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        BetMessage(stringResource(if (state.error == BetsError.Network) R.string.bets_error_network else R.string.bets_error_general))
                        TextButton(onClick = betsViewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                bets.isEmpty() -> item { WebEmpty(webCopy("emptyStates.noBets"), webCopy("emptyStates.betsComing"), height = 260) }
                else -> items(bets.asReversed(), key = { bet -> bet.betId ?: scalar(bet.id) ?: "${bet.matchId}-${bet.date}-${bet.time}-${bet.hashCode()}" }) { bet ->
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
        shape = RoundedCornerShape(8.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.heightIn(min = 72.dp).padding(10.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(label, color = WebMuted, fontSize = 11.sp)
            Text(value, color = UclColors.ink, fontWeight = FontWeight.Bold, fontSize = 20.sp)
        }
    }
}

@Composable
private fun BetTabButton(label: String, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.height(46.dp),
        shape = RoundedCornerShape(6.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) Color(0xFF102451) else Color.Transparent,
            contentColor = if (selected) Color.White else UclColors.ink,
        ),
        border = null,
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
    ) { Text(message, modifier = Modifier.padding(20.dp), color = WebMuted) }
}

@Composable
private fun BetCard(bet: PlacedBetDto, onClick: () -> Unit) { WebBetCard(bet, onClick) }

internal fun scalar(value: kotlinx.serialization.json.JsonElement?): String? =
    value?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }?.takeIf(String::isNotBlank)
