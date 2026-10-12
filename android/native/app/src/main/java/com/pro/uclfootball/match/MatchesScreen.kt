package com.pro.uclfootball.match

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date

@Composable
fun MatchesRoute(container: UclAppContainer, onBack: () -> Unit, onTab: (String) -> Unit,
    onMatch: (String) -> Unit, onSignInRequired: () -> Unit) {
    val vm: MatchesViewModel = viewModel(factory = remember(container) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                MatchesViewModel(FixturesRepository(container.apiClient)) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume(vm::resume)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    MatchesContent(state, onBack, onMatch, vm::refresh)
}

@Composable
internal fun MatchesContent(state: FixturesUiState, onBack: () -> Unit, onMatch: (String) -> Unit, onRetry: () -> Unit) {
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) { while (true) { delay(30_000); now = System.currentTimeMillis() } }
    val matches = upcomingMatches(state.matches, now)
    val locale = LocalConfiguration.current.locales[0]
    val days = matches.groupBy { SimpleDateFormat("EEEE, d MMMM", locale).format(Date(matchStartMillis(it.tsgmt, it.date, it.time)!!)) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { BulletinHeading(webCopy("website.footballMatches"), onBack, webCopy("website.matchesIntro")) }
        if (state.error && state.hasContent) item { BulletinRefreshNotice(onRetry) }
        when {
            state.loading && !state.hasContent -> item { LinearProgressIndicator(Modifier.fillMaxWidth()); Text(webCopy("mobile.matches.loading"), Modifier.padding(top = 12.dp)) }
            state.error && !state.hasContent -> item { WebEmpty(webCopy("website.fixturesUnavailable"), webCopy("bulletin.tryAgain")); TextButton(onClick = onRetry) { Text(webCopy("bulletin.retry")) } }
            matches.isEmpty() -> item { WebEmpty(webCopy("website.noUpcomingMatches"), webCopy("website.checkBackForFixtures")); TextButton(onClick = onRetry) { Text(webCopy("bulletin.retry")) } }
            else -> days.forEach { (day, fixtures) ->
                item(key = "day-$day") { Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) { Text(day, fontSize = 14.sp, fontWeight = FontWeight.Bold); HorizontalDivider(Modifier.weight(1f)) } }
                item(key = "fixtures-$day") {
                    Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surface, border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
                        Column { fixtures.forEachIndexed { index, match ->
                            if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            BulletinFixture(match) { match.matchId.textValue().takeIf(String::isNotBlank)?.let(onMatch) }
                        } }
                    }
                }
            }
        }
    }
}

@Composable private fun BulletinFixture(match: MatchSummaryDto, onOpen: () -> Unit) {
    val locale = LocalConfiguration.current.locales[0]
    val time = matchStartMillis(match.tsgmt, match.date, match.time)?.let { SimpleDateFormat("HH:mm", locale).format(Date(it)) }.orEmpty()
    Column(Modifier.fillMaxWidth().clickable(onClick = onOpen).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            Text((if (match.league == "others") match.otherl else match.league) ?: webCopy("website.football"), Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
            Text(time, color = MaterialTheme.colorScheme.primary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                BulletinTeam(match.home, match.ihome.textValue()); BulletinTeam(match.away, match.iaway.textValue())
            }
            WebIcon("arrow_up_right", tint = MaterialTheme.colorScheme.primary)
        }
        if (match.company == true) CompanyGameBadge()
        Row(Modifier.fillMaxWidth()) {
            listOf(Triple("1–0", match.onenil, "onenil"), Triple("1–1", match.oneone, "oneone"), Triple("1–2", match.onetwo, "onetwo")).forEachIndexed { index, (score, odd, key) ->
                if (index > 0) VerticalDivider(Modifier.height(44.dp), color = MaterialTheme.colorScheme.outlineVariant)
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(score, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    Text(if ((odd.textValue().toDoubleOrNull() ?: 0.0) > 0) "${odd.textValue()}%" else "—", color = MaterialTheme.colorScheme.primary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    if (match.company == true && match.comarket.textValue() == key) CompanyGameBadge(Modifier.padding(top = 4.dp))
                }
            }
        }
    }
}
