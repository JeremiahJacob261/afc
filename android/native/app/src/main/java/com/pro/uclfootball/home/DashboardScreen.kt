package com.pro.uclfootball.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.compose.runtime.remember
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.network.MatchSummaryDto
import com.pro.uclfootball.ui.UclColors
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

private val Ink = UclColors.ink
private val Body = UclColors.muted
private val Accent = UclColors.accent
private val Paper = UclColors.paper
private val Line = UclColors.dashboardLine

@Composable
fun DashboardRoute(
    container: UclAppContainer,
    selectedTab: String,
    onSelectTab: (String) -> Unit,
    onOpenMatch: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val dashboardViewModel: DashboardViewModel = viewModel(
        key = "dashboard-$selectedTab",
        factory = remember(container.apiClient, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    DashboardViewModel(container.apiClient, container.authSessionRepository) as T
            }
        },
    )
    val state by dashboardViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(dashboardViewModel::refresh)

    if (state.requiresSignIn) {
        androidx.compose.runtime.LaunchedEffect(Unit) { onSignInRequired() }
    }
    DashboardScreen(
        state = state,
        selectedTab = selectedTab,
        onRetry = dashboardViewModel::refresh,
        onSelectTab = onSelectTab,
        onOpenMatch = onOpenMatch,
    )
}

@Composable
private fun DashboardScreen(
    state: DashboardUiState,
    selectedTab: String,
    onRetry: () -> Unit,
    onSelectTab: (String) -> Unit,
    onOpenMatch: (String) -> Unit,
) {
    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = Paper,
        bottomBar = { NativeBottomBar(selectedTab, onSelectTab) },
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                start = 16.dp,
                top = 18.dp,
                end = 16.dp,
                bottom = 24.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(stringResource(R.string.nav_home).uppercase(), color = Body, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = state.username?.let { stringResource(R.string.dashboard_greeting, it) }
                                ?: stringResource(R.string.dashboard_title),
                            color = Ink,
                            fontFamily = FontFamily.Serif,
                            fontSize = 32.sp,
                        )
                    }
                    Text(
                        text = "UCL",
                        color = Ink,
                        fontFamily = FontFamily.Serif,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = UclColors.blueSurface),
                ) {
                    Column(Modifier.fillMaxWidth().padding(20.dp)) {
                        Text(stringResource(R.string.dashboard_matchday), color = UclColors.blueInk, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        Text(stringResource(R.string.dashboard_football_heading), color = Ink, fontFamily = FontFamily.Serif, fontSize = 26.sp)
                        Spacer(Modifier.height(6.dp))
                        Text(stringResource(R.string.dashboard_fresh_fixtures), color = Body, fontSize = 14.sp)
                    }
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(stringResource(R.string.dashboard_upcoming), color = Ink, fontSize = 24.sp, fontFamily = FontFamily.Serif)
                        Text(stringResource(R.string.dashboard_server_fresh), color = Body, fontSize = 13.sp)
                    }
                    if (!state.isLoading) {
                        Text(
                            text = stringResource(R.string.common_refresh),
                            color = Accent,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clickable(onClick = onRetry)
                                .padding(12.dp),
                        )
                    }
                }
            }
            if (state.isLoading) {
                item { StateCard(stringResource(R.string.dashboard_loading), state = "loading") }
            } else if (state.errorMessage != null) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        StateCard(state.errorMessage, state = "error")
                        Button(
                            onClick = onRetry,
                            colors = ButtonDefaults.buttonColors(containerColor = Accent),
                        ) { Text(stringResource(R.string.common_retry), color = Paper) }
                    }
                }
            } else if (state.matches.isEmpty()) {
                item { StateCard(stringResource(R.string.dashboard_no_fixtures), state = "empty") }
            } else {
                items(state.matches, key = { it.matchId?.jsonPrimitive?.contentOrNull ?: it.id?.jsonPrimitive?.contentOrNull ?: "${it.home}-${it.away}-${it.time}" }) { match ->
                    FixtureCard(match = match, onClick = {
                        match.matchId?.jsonPrimitive?.contentOrNull?.takeIf(String::isNotBlank)?.let(onOpenMatch)
                    })
                }
            }
        }
    }
}

@Composable
private fun FixtureCard(match: MatchSummaryDto, onClick: () -> Unit) {
    val league = if (match.league == "others") match.otherl else match.league
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Line),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(league?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_football), color = Body, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Text(listOfNotNull(match.date, match.time).joinToString("  "), color = Body, fontSize = 12.sp)
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(match.home?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_home_team), color = Ink, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text(match.away?.takeIf(String::isNotBlank) ?: stringResource(R.string.dashboard_away_team), color = Ink, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(stringResource(R.string.dashboard_view_markets), color = Accent, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("↗", color = Accent, fontSize = 20.sp)
                }
            }
        }
    }
}

@Composable
private fun StateCard(message: String, state: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = if (state == "error") UclColors.errorSurface else Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, Line),
    ) {
        Text(message, modifier = Modifier.padding(20.dp), color = if (state == "error") Color(0xFF8C2920) else Body)
    }
}
