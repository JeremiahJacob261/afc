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
import com.pro.uclfootball.ui.*
import com.pro.uclfootball.home.WebFixture

@Composable
fun MatchesRoute(container: UclAppContainer, onBack: () -> Unit, onTab: (String) -> Unit,
    onMatch: (String) -> Unit, onSignInRequired: () -> Unit) {
    val vm: DashboardViewModel = viewModel(key = "all-matches", factory = remember(container) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                DashboardViewModel(container.apiClient, container.authSessionRepository, 50, container.identityCache) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(vm::resume)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 16.dp, top = 32.dp, end = 16.dp, bottom = 48.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { WebBack(webCopy("website.matchdayAlt"), onBack) }
        item {
            Column(Modifier.padding(top = 8.dp, bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(webCopy("website.footballMatches"), style = MaterialTheme.typography.headlineLarge)
                Text(webCopy("website.matchesIntro"), color = WebMuted, style = MaterialTheme.typography.bodyLarge)
            }
        }
        when {
            state.isLoading && state.matches.isEmpty() -> item { CircularProgressIndicator() }
            state.errorMessage != null && state.matches.isEmpty() -> item {
                WebEmpty(webCopy("website.fixturesUnavailable"), webCopy("website.pleaseTryTheFullMatchesPage"))
                TextButton(onClick = vm::refresh) { Text(stringResource(R.string.common_retry)) }
            }
            state.matches.isEmpty() -> item { WebEmpty(webCopy("website.noUpcomingMatches"), webCopy("website.checkBackForFixtures"), height = 192, icon = "trophy") }
            else -> items(state.matches, key = { it.matchId.textValue().ifBlank { it.id.textValue() } }) { match ->
                WebFixture(match, compact = false) { match.matchId.textValue().takeIf(String::isNotBlank)?.let(onMatch) }
            }
        }
    }
}
