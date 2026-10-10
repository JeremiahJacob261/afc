package com.pro.uclfootball.match

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.home.DashboardViewModel
import com.pro.uclfootball.home.NativeBottomBar
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.UclColors

@Composable
fun MatchesRoute(container: UclAppContainer, onBack: () -> Unit, onTab: (String) -> Unit,
    onMatch: (String) -> Unit, onSignInRequired: () -> Unit) {
    val vm: DashboardViewModel = viewModel(key = "all-matches", factory = remember(container) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                DashboardViewModel(container.apiClient, container.authSessionRepository, 50) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(vm::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    Scaffold(containerColor = UclColors.paper, contentWindowInsets = WindowInsets.safeDrawing,
        bottomBar = { NativeBottomBar("matches", onTab) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            item { TextButton(onClick = onBack) { Text(stringResource(R.string.journey_back)) } }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(stringResource(R.string.matches_page_title), style = MaterialTheme.typography.headlineLarge)
                    Text(stringResource(R.string.matches_page_intro), color = UclColors.muted)
                }
            }
            when {
                state.isLoading -> item { CircularProgressIndicator() }
                state.errorMessage != null -> item {
                    Text(stringResource(R.string.journey_offline))
                    TextButton(onClick = vm::refresh) { Text(stringResource(R.string.common_retry)) }
                }
                state.matches.isEmpty() -> item { Text(stringResource(R.string.matches_page_empty)) }
                else -> items(state.matches, key = { it.matchId.textValue().ifBlank { it.id.textValue() } }) { match ->
                    val id = match.matchId.textValue()
                    Surface(Modifier.fillMaxWidth().clickable(enabled = id.isNotBlank(), onClick = { onMatch(id) }),
                        color = UclColors.surface, shape = MaterialTheme.shapes.medium) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(if (match.league == "others") match.otherl.orEmpty() else match.league.orEmpty(), color = UclColors.muted)
                            Text("${match.home.orEmpty()} · ${match.away.orEmpty()}", style = MaterialTheme.typography.titleMedium)
                            Text(listOfNotNull(match.date, match.time).joinToString(" · "), color = UclColors.muted)
                            Text(stringResource(R.string.matches_page_featured), style = MaterialTheme.typography.labelMedium)
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                listOf("1–0" to match.onenil, "1–1" to match.oneone, "1–2" to match.onetwo).forEach { (score, rate) ->
                                    val price = rate.textValue().takeIf { it.toBigDecimalOrNull()?.signum() == 1 }
                                    Text("$score · ${price?.let { "$it%" } ?: "—"}")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
