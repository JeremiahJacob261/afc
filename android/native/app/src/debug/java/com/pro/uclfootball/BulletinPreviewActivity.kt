package com.pro.uclfootball

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.bets.*
import com.pro.uclfootball.match.*
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.*
import kotlinx.serialization.json.JsonPrimitive

/** Local, debug-only visual fixture. Never linked into the signed release. */
class BulletinPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        getSharedPreferences("customer_ui", MODE_PRIVATE).edit()
            .putString("language", intent.getStringExtra("language") ?: "en").commit()
        val screen = intent.getStringExtra("screen") ?: "matches"
        val future = System.currentTimeMillis() + 7_200_000
        val summary = MatchSummaryDto(matchId = JsonPrimitive("SYNTHETIC-001"), home = "Ružomberok", away = "Žilina",
            league = "Slovakia Super Liga", tsgmt = JsonPrimitive(future), company = true, verified = false,
            onenil = JsonPrimitive("0.650"), oneone = JsonPrimitive("0.730"), onetwo = JsonPrimitive("0.080"))
        val match = MatchDetailDto(matchId = summary.matchId, home = summary.home, away = summary.away,
            league = summary.league, tsgmt = summary.tsgmt, company = true, comarket = JsonPrimitive("nilnil"), verified = false,
            nilnil = JsonPrimitive("0.400"), onenil = summary.onenil, oneone = summary.oneone, onetwo = summary.onetwo,
            nilone = JsonPrimitive("0.400"), twonil = JsonPrimitive("0.180"), niltwo = JsonPrimitive("0.300"),
            twoone = JsonPrimitive("0.250"), twotwo = JsonPrimitive("0.700"), threenil = JsonPrimitive("0.220"),
            nilthree = JsonPrimitive("0.190"), threeone = JsonPrimitive("0.320"), onethree = JsonPrimitive("0.370"),
            twothree = JsonPrimitive("0.550"), threetwo = JsonPrimitive("0.100"), threethree = JsonPrimitive(0), otherscores = JsonPrimitive("0.450"))
        val bet = PlacedBetDto(betId = "SYNTHETIC-001", home = summary.home, away = summary.away,
            market = "1 - 1", tsgmt = summary.tsgmt, stake = JsonPrimitive(50_000), odd = JsonPrimitive("0.730"),
            profit = JsonPrimitive(365), aim = JsonPrimitive(50_365))
        val settled = listOf("won", "lost", "refunded").mapIndexed { index, outcome ->
            bet.copy(betId = "SYNTHETIC-${index + 3}", settlementOutcome = outcome, tsgmt = JsonPrimitive(future - 86_400_000))
        }
        setContent {
            UclTheme {
                UserWebShell(if (screen == "bets" || screen == "bet") "bets" else "matches", {}) {
                    Column {
                        Text("Synthetic fixtures · submissions disabled", Modifier.padding(8.dp), fontSize = 11.sp)
                        Box(Modifier.weight(1f)) {
                            when (screen) {
                                "matches" -> MatchesContent(FixturesUiState(loading = false, hasContent = true, matches = listOf(summary,
                                    summary.copy(matchId = JsonPrimitive("SYNTHETIC-002"), home = "Manchester United", away = "Wolverhampton Wanderers", league = "Premier League", tsgmt = JsonPrimitive(future + 5_400_000)),
                                    summary.copy(matchId = JsonPrimitive("SYNTHETIC-003"), home = "Borussia Mönchengladbach", away = "Eintracht Frankfurt", league = "Bundesliga", tsgmt = JsonPrimitive(future + 86_400_000)))), {}, {}, {})
                                "match" -> MatchDetailScreen(MatchDetailUiState(isLoading = false, hasContent = true, match = match), {}, {}, {})
                                "stake" -> BetSlipContent(BetSlipState(stake = "50000", match = match, account = MeResponse("success", CustomerProfileDto(balance = JsonPrimitive(100000)))), "SYNTHETIC-001", "oneone", {}, {}, {}, {})
                                "bets" -> BetsContent(BetsUiState(isLoading = false, hasContent = true, unsettled = listOf(bet), settled = settled), "bets", {}, {}, {})
                                else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                    item { BulletinHeading(webCopy("mobile.bets.details"), {}) }
                                    item { BetDetailCard(settled.last(), match) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
