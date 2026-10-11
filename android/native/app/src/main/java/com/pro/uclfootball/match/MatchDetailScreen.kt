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
import com.pro.uclfootball.ui.*
import com.pro.uclfootball.network.textValue
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.ui.platform.LocalConfiguration
import java.util.Date
import java.text.SimpleDateFormat
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
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, top = 24.dp, end = 16.dp, bottom = 48.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item { WebBack(webCopy("mobile.nav.matches"), onBack) }
            when {
                state.isLoading && !state.hasContent -> item { DetailStateCard(stringResource(R.string.match_loading), "loading") }
                state.error != null && !state.hasContent -> item {
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
                        Column(Modifier.padding(top = 14.dp, bottom = 2.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(webCopy("mobile.match.market"), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 28.sp)
                            Text(webCopy("mobile.match.placeBet"), color = WebMuted, fontSize = 16.sp)
                        }
                    }
                    items(scoreMarkets.chunked(2)) { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            row.forEach { market -> Box(Modifier.weight(1f)) { MarketAvailabilityCard(state.match, market, state.vipLevel) { onSelectMarket(market.key) } } }
                            if (row.size == 1) Spacer(Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MatchHeader(match: MatchDetailDto) {
    val date = matchStartMillis(match.tsgmt, match.date, match.time)?.let { SimpleDateFormat("dd MMM yyyy, HH:mm", LocalConfiguration.current.locales[0]).format(Date(it)) } ?: "TBD"
    Surface(shape = RoundedCornerShape(16.dp), color = Color(0xFF102451)) {
        Column(Modifier.fillMaxWidth().padding(20.dp)) {
            Text((if (match.league == "others") match.otherl else match.league).orEmpty(), color = Color(0xFFD7E2ED), fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Row(Modifier.padding(top = 8.dp, bottom = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                WebIcon("clock3", Modifier.size(16.dp), Color(0xFFD7E2ED)); Text("$date ${webCopy("website.localTime")}", color = Color(0xFFD7E2ED), fontSize = 14.sp)
            }
            HorizontalDivider(color = Color.White.copy(alpha = .2f))
            Row(Modifier.fillMaxWidth().heightIn(min = 160.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(Modifier.size(56.dp), shape = CircleShape, color = Color.White) { WebRemoteImage(match.ihome.textValue(), Modifier.padding(6.dp)) }
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${match.home.orEmpty()} vs ${match.away.orEmpty()}", fontFamily = FontFamily.Serif, fontSize = 28.sp, lineHeight = 31.sp, color = Color.White, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    Text("${webCopy("mobile.match.matchId")} ${match.matchId.textValue()}", Modifier.padding(top = 16.dp), color = Color(0xFFD7E2ED), fontSize = 13.sp)
                }
                Surface(Modifier.size(56.dp), shape = CircleShape, color = Color.White) { WebRemoteImage(match.iaway.textValue(), Modifier.padding(6.dp)) }
            }
            match.company?.takeIf(String::isNotBlank)?.let { HorizontalDivider(color = Color.White.copy(alpha = .2f)); Text(it, Modifier.padding(top = 16.dp), color = Color(0xFFD7E2ED), fontSize = 14.sp) }
        }
    }
}

@Composable
private fun MarketAvailabilityCard(match: MatchDetailDto, market: ScoreMarket, vipLevel: Int, onSelect: () -> Unit) {
    val base = match.marketValue(market.key)?.toDouble() ?: 0.0
    val bonus = listOf(0.0, 0.0, .10, .20, .33, .47, .63, .83).getOrElse(vipLevel) { 0.0 }
    val odd = base * (1 + bonus)
    val available = odd > 0
    val protected = !match.company.isNullOrBlank() && match.comarket.textValue() == market.key
    Surface(shape = RoundedCornerShape(12.dp), color = if (!available) UclColors.surface else if (protected) UclColors.blueSurface else Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, if (protected) UclColors.secondary else UclColors.dashboardLine)) {
        Column(Modifier.fillMaxWidth().heightIn(min = 120.dp).clickable(enabled = available, onClick = onSelect).padding(16.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Text(if (market.key == "otherscores") webCopy("mobile.markets.other") else market.label.replace("\u2013", "-"), fontFamily = FontFamily.Serif, fontSize = 24.sp)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(webCopy(if (protected) "mobile.match.companyGame" else "landing.live.odds"), Modifier.weight(1f), color = WebMuted, fontSize = 12.sp, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                Text(if (available) String.format(java.util.Locale.ROOT, "%.3f%%", odd) else "\u2014", color = if (available) UclColors.accent else WebMuted, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                WebIcon("chevron_right", Modifier.size(18.dp), if (available) UclColors.accent else WebMuted)
            }
        }
    }
}

internal fun MatchDetailDto.marketValue(key: String): BigDecimal? {
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
        Text(message, modifier = Modifier.padding(20.dp), color = if (state == "error") UclColors.error else WebMuted)
    }
}
