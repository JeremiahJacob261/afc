package com.pro.uclfootball.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
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
import java.util.*

@Composable
fun DashboardRoute(container: UclAppContainer, selectedTab: String, onSelectTab: (String) -> Unit,
    onOpenMatch: (String) -> Unit, onSignInRequired: () -> Unit, onOpenBet: (String) -> Unit = {}) {
    val vm: DashboardViewModel = viewModel(key = "dashboard-$selectedTab", factory = remember(container) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                DashboardViewModel(container.apiClient, container.authSessionRepository, identityCache = container.identityCache) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume(vm::resume)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    DashboardScreen(state, onSelectTab, onOpenMatch, onOpenBet)
}

@Composable
internal fun DashboardScreen(state: DashboardUiState, onNavigate: (String) -> Unit, onMatch: (String) -> Unit, onBet: (String) -> Unit) {
    var filter by remember { mutableStateOf("today") }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) { while (true) { delay(60_000); now = System.currentTimeMillis() } }
    val locale = LocalConfiguration.current.locales[0]
    val shown = state.matches.filter { match ->
        val start = matchStartMillis(match.tsgmt, match.date, match.time) ?: return@filter false
        start > now && when (filter) {
            "next3h" -> start <= now + 3 * 3_600_000
            "next12h" -> start <= now + 12 * 3_600_000
            "tomorrow" -> sameDay(start, Calendar.getInstance().apply { timeInMillis = now; add(Calendar.DATE, 1) }.timeInMillis)
            else -> sameDay(start, now)
        }
    }.sortedBy { matchStartMillis(it.tsgmt, it.date, it.time) }
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp)) {
        item { DashboardCarousel(onNavigate) }
        item { Spacer(Modifier.height(16.dp)); SpinInvitation { onNavigate("wheel") } }
        item {
            Row(Modifier.fillMaxWidth().padding(top = 28.dp, bottom = 20.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(if (state.username.isNullOrBlank()) webCopy("website.yourMatchday") else webCopy("website.helloUser", "username" to state.username),
                        color = UclColors.muted, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Row { Text(webCopy("website.matchdayAlt"), fontFamily = FontFamily.Serif, fontSize = 32.sp, letterSpacing = (-.8).sp)
                        Text(".", fontFamily = FontFamily.Serif, fontSize = 32.sp, color = UclColors.secondary) }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.width(1.dp).height(48.dp).background(UclColors.dashboardLine))
                    Column(Modifier.widthIn(min = 64.dp).padding(start = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(SimpleDateFormat("dd", locale).format(Date(now)), fontFamily = FontFamily.Serif, fontSize = 32.sp)
                        Text(SimpleDateFormat("MMM", locale).format(Date(now)).uppercase(locale), color = WebMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.1.sp)
                    }
                }
            }
        }
        item {
            WebPanel {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(Modifier.weight(1f)) {
                        Text(webCopy("website.fixtures"), fontFamily = FontFamily.Serif, fontSize = 30.sp, letterSpacing = (-.75).sp)
                        Text(webCopy("website.kickoffTimesShownInYourLocalTime"), Modifier.padding(top = 8.dp), color = WebMuted, fontSize = 14.sp)
                    }
                    Row(Modifier.heightIn(min = 44.dp).clickable { onNavigate("matches") }, verticalAlignment = Alignment.CenterVertically) {
                        Text(webCopy("website.viewAll"), color = UclColors.accent, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        WebIcon("arrow_up_right", Modifier.size(18.dp), UclColors.accent)
                    }
                }
                Row(Modifier.padding(top = 20.dp, bottom = 24.dp).fillMaxWidth().background(UclColors.surface, RoundedCornerShape(12.dp)).padding(4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    listOf("today", "next3h", "next12h", "tomorrow").forEach { key ->
                        Box(Modifier.weight(1f).heightIn(min = 44.dp).clip(RoundedCornerShape(8.dp))
                            .background(if (filter == key) Color(0xFF102451) else Color.Transparent).clickable { filter = key }.padding(horizontal = 2.dp), contentAlignment = Alignment.Center) {
                            Text(webCopy("mobile.filters.$key"), fontSize = 12.sp, fontWeight = FontWeight.Bold,
                                color = if (filter == key) Color.White else WebMuted, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        }
                    }
                }
                Row(Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(webCopy("website.footballFixtures"), Modifier.weight(1f), color = WebMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = .55.sp)
                    Text(webCopy("website.featuredCorrectScore"), Modifier.weight(1f), color = Color(0xFF3B608E), fontSize = 11.sp, fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.End)
                }
                HorizontalDivider(color = UclColors.dashboardLine)
                if (shown.isEmpty()) {
                    Column(Modifier.fillMaxWidth().padding(vertical = 48.dp, horizontal = 16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        WebIcon("trophy", Modifier.size(28.dp), WebMuted)
                        Text(webCopy(if (state.isLoading) "website.loadingFixtures" else if (state.errorMessage != null) "website.fixturesUnavailable" else "website.noMatchesInThisWindow"), fontWeight = FontWeight.Bold, fontSize = 18.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        Text(webCopy(if (state.isLoading) "website.checkingTheLatestSchedule" else if (state.errorMessage != null) "website.pleaseTryTheFullMatchesPage" else "website.tryAnotherTimeWindowOrSeeEveryMatch"), color = WebMuted, fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        if (!state.isLoading) WebTextLink(webCopy("website.browseAllMatches")) { onNavigate("matches") }
                    }
                } else shown.forEachIndexed { index, match ->
                    WebFixture(match, compact = true) { match.matchId.textValue().takeIf(String::isNotBlank)?.let(onMatch) }
                    if (index < shown.lastIndex) HorizontalDivider(color = UclColors.dashboardLine)
                }
            }
        }
        item {
            Spacer(Modifier.height(24.dp))
            WebPanel {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(webCopy("website.openBets"), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        Box(Modifier.size(24.dp).background(UclColors.surface, CircleShape), contentAlignment = Alignment.Center) {
                            Text(if (state.betsLoading || state.betsError) "—" else state.openBets.size.toString(), color = WebMuted, fontSize = 12.sp)
                        }
                    }
                    IconButton(onClick = { onNavigate("bets") }) { WebIcon("arrow_right", Modifier.size(19.dp), UclColors.accent, webCopy("website.viewAllBets")) }
                }
                val bet = state.openBets.firstOrNull()
                if (bet != null) Column(Modifier.padding(top = 16.dp).clickable { bet.betId?.let(onBet) }, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("${bet.home.orEmpty()} — ${bet.away.orEmpty()}", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("${bet.market ?: webCopy("website.matchSelection")} · ${bet.stake.textValue()} ${webCopy("website.mmkStake")}", color = WebMuted, fontSize = 13.sp)
                    WebTextLink(webCopy("website.viewBet")) { bet.betId?.let(onBet) }
                } else Text(webCopy(if (state.betsLoading) "website.loadingOpenBets" else if (state.betsError) "website.unableToLoadOpenBetsOpenYourBetsToTryAgain" else "website.noOpenBetsRightNowYourNextSelectionWillAppearHere"), Modifier.padding(top = 16.dp), color = WebMuted, fontSize = 14.sp, lineHeight = 21.sp)
            }
            Spacer(Modifier.height(16.dp))
            WebPanel {
                Text(webCopy("website.community"), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(16.dp))
                val context = LocalContext.current
                listOf(Triple("Telegram", "send", state.links.telegramGroupUrl), Triple("WhatsApp", "message_circle", state.links.whatsappGroupUrl)).forEach { (label, icon, url) ->
                    Row(Modifier.fillMaxWidth().heightIn(min = 44.dp).clickable { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        WebIcon(icon, Modifier.size(18.dp)); Text(label, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        WebIcon("arrow_up_right", Modifier.size(16.dp), UclColors.accent)
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardCarousel(onNavigate: (String) -> Unit) {
    var slide by remember { mutableIntStateOf(0) }; var drag by remember { mutableFloatStateOf(0f) }
    val slides = listOf(listOf("matchday", "followTheMatchAlt", "fixturesAndLiveMovementAllInOnePlace", "viewMatches", "matches"), listOf("marketsAlt", "findYourMarket", "exploreFootballPricesBeforeYouPlaceABet", "exploreMarkets", "matches"), listOf("yourAccount", "yourFundsInView", "manageDepositsAndWithdrawalsFromYourWallet", "openWallet", "wallet"))
    val copy = slides[slide]
    val narrow = LocalConfiguration.current.screenWidthDp <= 390
    Box(Modifier.fillMaxWidth().heightIn(min = 200.dp).clip(RoundedCornerShape(16.dp)).background(UclColors.blueSurface)
        .pointerInput(Unit) { detectHorizontalDragGestures(onDragStart = { drag = 0f }, onHorizontalDrag = { change, amount -> change.consume(); drag += amount }, onDragEnd = { if (kotlin.math.abs(drag) > 50.dp.toPx()) slide = (slide + if (drag > 0) 2 else 1) % 3 }) }) {
        Canvas(Modifier.matchParentSize()) {
            val center = androidx.compose.ui.geometry.Offset(size.width - 30.dp.toPx(), size.height + 10.dp.toPx())
            drawCircle(Color(0xFFDDE8F8), 270.dp.toPx(), center); drawCircle(Color(0xFFCFDEF5), 230.dp.toPx(), center)
            drawCircle(Color(0xFFB7CCEF), 190.dp.toPx(), center, style = Stroke(2.dp.toPx()))
        }
        Column(Modifier.padding(if (narrow) 20.dp else 24.dp).widthIn(max = if (narrow) 230.dp else 480.dp)) {
            Text(webCopy("website.${copy[0]}"), color = UclColors.blueInk, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = .96.sp)
            Text(webCopy("website.${copy[1]}"), Modifier.padding(top = 12.dp, bottom = 8.dp), fontFamily = FontFamily.Serif, fontSize = 28.sp, lineHeight = 30.sp, letterSpacing = (-.56).sp)
            Text(webCopy("website.${copy[2]}"), color = Color(0xFF415F86), fontSize = if (narrow) 13.sp else 15.sp, lineHeight = if (narrow) 19.5.sp else 22.5.sp)
            WebTextLink(webCopy("website.${copy[3]}"), Color(0xFF0D49B5), Modifier.padding(top = 8.dp)) { onNavigate(copy[4]) }
        }
        Row(Modifier.align(Alignment.TopEnd).padding(8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            CarouselButton("chevron_left", webCopy("website.previousHighlight")) { slide = (slide + 2) % 3 }
            Text("${slide + 1} / 3", color = Color(0xFF234C88), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            CarouselButton("chevron_right", webCopy("website.nextHighlight")) { slide = (slide + 1) % 3 }
        }
    }
}

@Composable private fun CarouselButton(icon: String, label: String, onClick: () -> Unit) {
    Surface(onClick, Modifier.size(36.dp), shape = CircleShape, color = Color.White, border = BorderStroke(1.dp, Color(0xFFC7D8EE))) {
        Box(contentAlignment = Alignment.Center) { WebIcon(icon, Modifier.size(20.dp), Color(0xFF234C88), label) }
    }
}

@Composable private fun SpinInvitation(onClick: () -> Unit) {
    Surface(shape = RoundedCornerShape(16.dp), color = UclColors.blueSurface, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(76.dp), contentAlignment = Alignment.Center) {
                    Canvas(Modifier.fillMaxSize()) {
                        drawCircle(Color(0xFFDC8C16)); drawCircle(Color(0xFFFFC532), radius = size.width / 2 - 3.dp.toPx())
                        listOf(0xFFDDEAFF,0xFFA7C9FF,0xFF5C97EE,0xFF245BBF,0xFF143A85,0xFF0B2252,0xFF5C97EE,0xFFA7C9FF).forEachIndexed { i, c ->
                            drawArc(Color(c), -112.5f + i * 45, 45f, true, topLeft = androidx.compose.ui.geometry.Offset(8.dp.toPx(), 8.dp.toPx()), size = androidx.compose.ui.geometry.Size(size.width - 16.dp.toPx(), size.height - 16.dp.toPx()))
                        }
                    }
                    Box(Modifier.size(32.dp).background(UclColors.accent, CircleShape).padding(4.dp), contentAlignment = Alignment.Center) { Text(webCopy("website.go"), color = Color.White, fontWeight = FontWeight.Black, fontSize = 10.sp) }
                }
                Column(Modifier.weight(1f)) {
                    Text(webCopy("website.wheelSpin"), fontFamily = FontFamily.Serif, fontSize = 24.sp, lineHeight = 28.sp)
                    Text(webCopy("website.takeYourDailySpinOneSpinEvery24Hours"), Modifier.padding(top = 4.dp), color = UclColors.muted, fontSize = 13.sp, lineHeight = 18.sp)
                }
            }
            Button(onClick, Modifier.fillMaxWidth().heightIn(min = 44.dp), shape = RoundedCornerShape(8.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF102451))) {
                Text(webCopy("website.spinWheel"), fontSize = 14.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.width(8.dp)); WebIcon("arrow_right", Modifier.size(18.dp), Color.White)
            }
        }
    }
}

@Composable fun WebTextLink(label: String, color: Color = UclColors.accent, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(modifier.heightIn(min = 44.dp).clickable(onClick = onClick), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, color = color, fontWeight = FontWeight.Bold, fontSize = 14.sp); WebIcon("arrow_right", Modifier.size(18.dp), color)
    }
}

@Composable fun WebFixture(match: MatchSummaryDto, compact: Boolean, onClick: () -> Unit) {
    val locale = LocalConfiguration.current.locales[0]
    val date = matchStartMillis(match.tsgmt, match.date, match.time)?.let { SimpleDateFormat("dd MMM yyyy, HH:mm", locale).format(Date(it)) } ?: "TBD"
    val content: @Composable ColumnScope.() -> Unit = {
        Row(Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text((if (match.league == "others") match.otherl else match.league) ?: webCopy("website.football"), Modifier.weight(1f), color = WebMuted, fontSize = if (compact) 11.sp else 12.sp)
            Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.End)) {
                WebIcon("clock3", Modifier.size(14.dp), WebMuted)
                Text("$date ${webCopy("website.localTime")}", color = WebMuted, fontSize = if (compact) 11.sp else 12.sp, textAlign = androidx.compose.ui.text.style.TextAlign.End)
            }
        }
        if (!compact) HorizontalDivider(color = UclColors.dashboardLine)
        if (compact) Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FixtureTeams(match, true, Modifier.weight(1f))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                FixturePrices(match, true); Box(Modifier.size(32.dp), contentAlignment = Alignment.Center) { WebIcon("arrow_up_right", Modifier.size(18.dp), UclColors.accent) }
            }
        } else Column(Modifier.padding(top = 16.dp, bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            FixtureTeams(match, false, Modifier.fillMaxWidth()); FixturePrices(match, false)
        }
    }
    if (compact) Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick).padding(16.dp), content = content)
    else Box {
        WebPanel(Modifier.clickable(onClick = onClick), padding = 16) { Column(Modifier.padding(end = 24.dp), content = content) }
        WebIcon("arrow_up_right", Modifier.align(Alignment.CenterEnd).padding(end = 12.dp).size(20.dp), UclColors.accent)
    }
}

@Composable private fun FixtureTeams(match: MatchSummaryDto, compact: Boolean, modifier: Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(if (compact) 8.dp else 12.dp)) {
        listOf(match.home to match.ihome, match.away to match.iaway).forEach { (name, image) ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(Modifier.size(if (compact) 32.dp else 36.dp), color = UclColors.paper, shape = CircleShape, border = BorderStroke(1.dp, UclColors.dashboardLine)) { WebRemoteImage(image.textValue(), Modifier.padding(2.dp)) }
                Text(name ?: webCopy("common.team"), fontSize = if (compact) 13.sp else 16.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable private fun FixturePrices(match: MatchSummaryDto, compact: Boolean) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (!compact) Text(webCopy("website.featuredCorrectScore"), fontSize = 12.sp, color = WebMuted, fontWeight = FontWeight.Bold)
        Row(horizontalArrangement = Arrangement.spacedBy(if (compact) 4.dp else 6.dp)) {
            listOf("1–0" to match.onenil, "1–1" to match.oneone, "1–2" to match.onetwo).forEach { (score, price) ->
                Surface(shape = RoundedCornerShape(8.dp), color = UclColors.paper, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
                    Column(Modifier.widthIn(min = if (compact) 42.dp else 56.dp).heightIn(min = 52.dp).padding(if (compact) 2.dp else 8.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterVertically)) {
                        Text(score, color = WebMuted, fontSize = 11.sp)
                        Text(price.textValue().ifBlank { "—" } + if (!compact && (price.textValue().toDoubleOrNull() ?: 0.0) > 0) "%" else "", fontWeight = FontWeight.Bold, fontSize = if (compact) 12.sp else 14.sp)
                    }
                }
            }
        }
    }
}

private fun sameDay(a: Long, b: Long): Boolean {
    val first = Calendar.getInstance().apply { timeInMillis = a }; val second = Calendar.getInstance().apply { timeInMillis = b }
    return first.get(Calendar.YEAR) == second.get(Calendar.YEAR) && first.get(Calendar.DAY_OF_YEAR) == second.get(Calendar.DAY_OF_YEAR)
}
