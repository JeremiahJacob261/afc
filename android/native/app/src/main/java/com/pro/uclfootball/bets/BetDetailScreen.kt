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
import com.pro.uclfootball.ui.UclColors

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
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar("bets", onSelectTab) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                TextButton(onClick = onBack, contentPadding = PaddingValues(horizontal = 0.dp, vertical = 8.dp)) {
                    Text(stringResource(R.string.bets_back), color = UclColors.accent)
                }
            }
            item {
                Text(stringResource(R.string.bets_detail_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 30.sp)
            }
            when {
                state.isLoading -> item { BetDetailMessage(stringResource(R.string.bets_loading)) }
                state.error != null -> item {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        BetDetailMessage(stringResource(if (state.error == BetDetailError.Network) R.string.bets_error_network else R.string.bets_error_general))
                        TextButton(onClick = detailViewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                }
                state.response != null -> item { BetDetailCard(state.response!!.bet) }
            }
        }
    }
}

@Composable
private fun BetDetailCard(bet: PlacedBetDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(
                "${bet.home?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_home_team)}  vs  ${bet.away?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_away_team)}",
                color = UclColors.ink,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(bet.market?.takeIf(String::isNotBlank) ?: stringResource(R.string.bets_market_unknown), color = UclColors.muted)
            BetDetailValue(stringResource(R.string.bets_detail_selection), listOfNotNull(bet.ihome, bet.iaway).joinToString(" / ").ifBlank { "—" })
            BetDetailValue(stringResource(R.string.bets_stake), money(bet.stake))
            BetDetailValue(stringResource(R.string.bets_profit), money(bet.profit))
            BetDetailValue(stringResource(R.string.bets_odds), money(bet.odd, useCurrency = false))
            BetDetailValue(stringResource(R.string.bets_detail_id), bet.betId ?: scalar(bet.id) ?: stringResource(R.string.bets_id_unavailable))
            val date = listOfNotNull(bet.matchDate ?: bet.date, bet.matchTime ?: bet.time).joinToString(" · ")
            if (date.isNotBlank()) BetDetailValue(stringResource(R.string.bets_detail_kickoff), date)
            if (com.pro.uclfootball.BuildConfig.CURRENCY_LABEL.isBlank()) {
                Text(stringResource(R.string.bets_amount_hidden), color = UclColors.muted, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun BetDetailValue(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = UclColors.muted)
        if (value.isNotEmpty()) Text(value, color = UclColors.ink, fontWeight = FontWeight.SemiBold)
    }
    Spacer(Modifier.height(1.dp))
}

@Composable
private fun BetDetailMessage(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = UclColors.muted) }
}

@Composable
private fun money(raw: kotlinx.serialization.json.JsonElement?, useCurrency: Boolean = true): String {
    val value = scalar(raw) ?: return "—"
    return if (useCurrency) {
        com.pro.uclfootball.BuildConfig.CURRENCY_LABEL.takeIf(String::isNotBlank)?.let { "$value $it" }
            ?: stringResource(R.string.bets_amount_hidden)
    } else value
}
