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
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.Role
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
internal fun MatchDetailScreen(
    state: MatchDetailUiState,
    onBack: () -> Unit,
    onRetry: () -> Unit,
    onSelectMarket: (String) -> Unit,
) {
    var selectedMarket by rememberSaveable(state.match?.matchId.textValue()) { mutableStateOf<String?>(null) }
    Scaffold(
        contentWindowInsets = com.pro.uclfootball.ui.UserContentInsets,
        containerColor = androidx.compose.ui.graphics.Color.Transparent,
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 16.dp, top = 24.dp, end = 16.dp, bottom = 48.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item { BulletinHeading(webCopy("mobile.nav.matches"), onBack) }
            if (state.error != null && state.hasContent) item { BulletinRefreshNotice(onRetry) }
            when {
                state.isLoading && !state.hasContent -> item { DetailStateCard(stringResource(R.string.match_loading), "loading") }
                state.error != null && !state.hasContent -> item {
                    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
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
                            Text(webCopy("mobile.match.market"), color = MaterialTheme.colorScheme.onSurface, fontFamily = WebInter, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                            Text(webCopy("bulletin.selectMarket"), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
                            HorizontalDivider(color = MaterialTheme.colorScheme.primary, thickness = 2.dp)
                        }
                    }
                    items(scoreMarkets.chunked(2)) { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(0.dp)) {
                            row.forEach { market -> Box(Modifier.weight(1f)) { MarketAvailabilityCard(state.match, market, state.vipLevel, selectedMarket == market.key) { selectedMarket = market.key; onSelectMarket(market.key) } } }
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
    val date = matchStartMillis(match.tsgmt, match.date, match.time)?.let { SimpleDateFormat("dd MMM yyyy, HH:mm", LocalConfiguration.current.locales[0]).format(Date(it)) } ?: webCopy("common.timeToBeConfirmed")
    Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surface, border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text((if (match.league == "others") match.otherl else match.league).orEmpty(), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            BulletinTeam(match.home, match.ihome.textValue(), large = true)
            BulletinTeam(match.away, match.iaway.textValue(), large = true)
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Text("$date · ${webCopy("website.localTime")}", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            if (match.company == true) Text(webCopy("mobile.match.companyGame"), color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun MarketAvailabilityCard(match: MatchDetailDto, market: ScoreMarket, vipLevel: Int, isSelected: Boolean, onSelect: () -> Unit) {
    val base = match.marketValue(market.key)?.toDouble() ?: 0.0
    val bonus = listOf(0.0, 0.0, .10, .20, .33, .47, .63, .83).getOrElse(vipLevel) { 0.0 }
    val odd = base * (1 + bonus)
    val available = odd > 0 && match.verified != true && (matchStartMillis(match.tsgmt, match.date, match.time) ?: 0) > System.currentTimeMillis()
    val protected = match.company == true && match.comarket.textValue() == market.key
    Surface(color = if (!available) MaterialTheme.colorScheme.surfaceVariant else if (isSelected || protected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(if (isSelected) 2.dp else 1.dp, if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant)) {
        Column(Modifier.fillMaxWidth().heightIn(min = 92.dp).semantics { selected = isSelected }.clickable(enabled = available, role = Role.Button, onClick = onSelect).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (market.key == "otherscores") webCopy("mobile.markets.other") else market.label.replace("\u2013", "-"), fontFamily = WebInter, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(webCopy(if (!available) "mobile.match.marketUnavailable" else if (protected) "mobile.match.companyGame" else "landing.live.odds"), Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 10.sp)
                Text(if (available) String.format(java.util.Locale.ROOT, "%.3f%%", odd) else "—", color = MaterialTheme.colorScheme.primary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
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
