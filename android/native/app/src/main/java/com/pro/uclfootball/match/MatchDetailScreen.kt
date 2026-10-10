package com.pro.uclfootball.match

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.clickable
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
import com.pro.uclfootball.network.MatchDetailDto
import com.pro.uclfootball.ui.UclColors
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import java.math.BigDecimal

private data class ScoreMarket(val key: String, val label: String)

private val scoreMarkets = listOf(
    ScoreMarket("nilnil", "0 – 0"), ScoreMarket("onenil", "1 – 0"),
    ScoreMarket("nilone", "0 – 1"), ScoreMarket("oneone", "1 – 1"),
    ScoreMarket("twonil", "2 – 0"), ScoreMarket("niltwo", "0 – 2"),
    ScoreMarket("twoone", "2 – 1"), ScoreMarket("onetwo", "1 – 2"),
    ScoreMarket("twotwo", "2 – 2"), ScoreMarket("threenil", "3 – 0"),
    ScoreMarket("nilthree", "0 – 3"), ScoreMarket("threeone", "3 – 1"),
    ScoreMarket("onethree", "1 – 3"), ScoreMarket("twothree", "2 – 3"),
    ScoreMarket("threetwo", "3 – 2"), ScoreMarket("threethree", "3 – 3"),
    ScoreMarket("otherscores", "Other"),
)

@Composable
fun MatchDetailRoute(
    matchId: String,
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectMarket: (String) -> Unit,
) {
    val matchViewModel: MatchDetailViewModel = viewModel(
        key = "match-$matchId",
        factory = remember(matchId, container.apiClient) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    MatchDetailViewModel(matchId, container.apiClient) as T
            }
        },
    )
    val state by matchViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(matchViewModel::refresh)
    MatchDetailScreen(
        state = state,
        onBack = onBack,
        onRetry = matchViewModel::refresh,
        onSelectMarket = onSelectMarket,
    )
}

@Composable
private fun MatchDetailScreen(
    state: MatchDetailUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onSelectMarket: (String) -> Unit,
) {
    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item {
                TextButton(onClick = onBack) {
                    Text(
                        text = stringResource(R.string.common_back_to_matches),
                        color = UclColors.accent,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            when {
                state.isLoading -> item { DetailStateCard(stringResource(R.string.match_loading), "loading") }
                state.error != null -> item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        val message = when (state.error) {
                            MatchDetailError.Network -> stringResource(R.string.match_error_network)
                            MatchDetailError.NotFound -> stringResource(R.string.match_error_not_found)
                            MatchDetailError.General -> stringResource(R.string.match_error_general)
                        }
                        DetailStateCard(message, "error")
                        Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = UclColors.accent)) {
                            Text(stringResource(R.string.common_retry), color = UclColors.paper)
                        }
                    }
                }
                state.match != null -> {
                    item { MatchHeader(state.match) }
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(stringResource(R.string.match_markets_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 26.sp)
                            Text(stringResource(R.string.match_markets_pending_note), color = UclColors.muted, fontSize = 14.sp)
                        }
                    }
                    items(scoreMarkets) { market ->
                        MarketAvailabilityCard(state.match, market) { onSelectMarket(market.key) }
                    }
                }
            }
        }
    }
}

@Composable
private fun MatchHeader(match: MatchDetailDto) {
    val league = if (match.league == "others") match.otherl else match.league
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = UclColors.ink),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(league?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_football), color = Color.White.copy(alpha = 0.76f), fontSize = 13.sp)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(match.home?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_home_team), color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text(stringResource(R.string.match_versus), color = Color.White.copy(alpha = 0.68f), modifier = Modifier.padding(horizontal = 8.dp))
                Text(match.away?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_away_team), color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.End)
            }
            val dateTime = listOfNotNull(match.date?.takeIf(String::isNotBlank), match.time?.takeIf(String::isNotBlank)).joinToString("  ")
            if (dateTime.isNotBlank()) Text(dateTime, color = Color.White.copy(alpha = 0.78f), fontSize = 13.sp)
            match.company?.takeIf(String::isNotBlank)?.let {
                Text(stringResource(R.string.match_company_market, it), color = Color.White, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun MarketAvailabilityCard(match: MatchDetailDto, market: ScoreMarket, onSelect: () -> Unit) {
    val value = match.marketValue(market.key)
    val available = value?.let { it > BigDecimal.ZERO } == true
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().clickable(enabled = available, onClick = onSelect).padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(market.label, color = UclColors.ink, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(
                text = stringResource(if (available) R.string.match_market_available else R.string.match_market_unavailable),
                color = if (available) UclColors.blueInk else UclColors.muted,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

private fun MatchDetailDto.marketValue(key: String): BigDecimal? {
    val raw = when (key) {
        "nilnil" -> nilnil
        "onenil" -> onenil
        "nilone" -> nilone
        "oneone" -> oneone
        "twonil" -> twonil
        "niltwo" -> niltwo
        "twoone" -> twoone
        "onetwo" -> onetwo
        "twotwo" -> twotwo
        "threenil" -> threenil
        "nilthree" -> nilthree
        "threeone" -> threeone
        "onethree" -> onethree
        "twothree" -> twothree
        "threetwo" -> threetwo
        "threethree" -> threethree
        "otherscores" -> otherscores
        else -> null
    } ?: return null
    if (raw == JsonNull) return null
    val text = (raw as? JsonPrimitive)?.contentOrNull ?: raw.toString()
    return text.toBigDecimalOrNull()
}

@Composable
private fun DetailStateCard(message: String, state: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = if (state == "error") UclColors.errorSurface else Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Text(message, modifier = Modifier.padding(20.dp), color = if (state == "error") UclColors.error else UclColors.muted)
    }
}
