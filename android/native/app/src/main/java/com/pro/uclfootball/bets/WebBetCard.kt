package com.pro.uclfootball.bets

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.*
import java.text.SimpleDateFormat
import java.util.Date

@Composable
internal fun WebBetCard(bet: PlacedBetDto, onClick: () -> Unit) {
    val outcome = bet.settlementOutcome ?: when (bet.won) { "true" -> "won"; "false" -> "lost"; else -> null }
    val start = matchStartMillis(bet.tsgmt, bet.matchDate ?: bet.date, bet.matchTime ?: bet.time)
    val status = if ((start ?: 0L) > System.currentTimeMillis()) "notStarted" else outcome ?: "ongoing"
    val tone = when (status) { "won" -> UclColors.success; "refunded" -> UclColors.accent; "lost" -> Color(0xFFA43D4A); "notStarted" -> UclColors.muted; else -> Color(0xFF8A6013) }
    val ground = when (status) { "won" -> UclColors.successSurface; "refunded" -> UclColors.blueSurface; "lost" -> Color(0xFFFBECEE); "notStarted" -> UclColors.surface; else -> Color(0xFFFBF2DC) }
    Surface(Modifier.fillMaxWidth().clickable(onClick = onClick), shape = RoundedCornerShape(16.dp), color = Color.White, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
        Column {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    WebBetTeam(bet.home, bet.ihome, Modifier.weight(1f)); Text("VS", color = Color(0xFF8A6013), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    WebBetTeam(bet.away, bet.iaway, Modifier.weight(1f), true)
                }
                Row(Modifier.fillMaxWidth().background(UclColors.surface, RoundedCornerShape(8.dp)).padding(8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Column(Modifier.weight(1f)) {
                        Text(webCopy("landing.markets.pickMarket"), color = UclColors.muted, fontSize = 11.sp)
                        Text(bet.market ?: webCopy("landing.markets.pickMarket"), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Surface(color = ground, shape = RoundedCornerShape(20.dp)) { Text(webCopy("status.$status"), Modifier.padding(horizontal = 8.dp, vertical = 4.dp), color = tone, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    WebBetMetric(webCopy("landing.live.odds"), String.format(java.util.Locale.ROOT, "%.3f%%", bet.odd.textValue().toDoubleOrNull() ?: 0.0), Modifier.weight(1f))
                    WebBetMetric(webCopy("mobile.bets.stake"), webMoney(bet.stake.textValue().toDoubleOrNull() ?: 0.0), Modifier.weight(1f))
                    val amount = (bet.stake.textValue().toDoubleOrNull() ?: 0.0) + if (outcome == "refunded") 0.0 else (bet.profit.textValue().toDoubleOrNull() ?: 0.0)
                    WebBetMetric(webCopy("mobile.match.profit"), webMoney(amount), Modifier.weight(1f))
                }
            }
            HorizontalDivider(color = UclColors.dashboardLine)
            Row(Modifier.fillMaxWidth().background(UclColors.surface).padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                val locale = LocalConfiguration.current.locales[0]
                Text("${webCopy("mobile.bets.kickoff")}: ${start?.let { SimpleDateFormat("dd MMM yyyy, HH:mm", locale).format(Date(it)) } ?: "TBD"}", Modifier.weight(1f), color = UclColors.muted, fontSize = 12.sp)
                Text("${webCopy("mobile.bets.betId")}: ${bet.betId.orEmpty()}", Modifier.weight(1f), color = UclColors.muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                WebIcon("chevron_right", Modifier.size(14.dp), UclColors.accent)
            }
        }
    }
}

@Composable internal fun WebBetTeam(name: String?, image: String?, modifier: Modifier, right: Boolean = false) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        if (!right) WebRemoteImage(image, Modifier.size(28.dp).clip(CircleShape).background(UclColors.surface))
        Text(name ?: webCopy("common.team"), Modifier.weight(1f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = if (right) androidx.compose.ui.text.style.TextAlign.End else androidx.compose.ui.text.style.TextAlign.Start)
        if (right) WebRemoteImage(image, Modifier.size(28.dp).clip(CircleShape).background(UclColors.surface))
    }
}
@Composable internal fun WebBetMetric(label: String, value: String, modifier: Modifier) {
    Surface(modifier, shape = RoundedCornerShape(8.dp), color = Color.White, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
        Column(Modifier.padding(8.dp)) { Text(label, color = UclColors.muted, fontSize = 11.sp); Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold) }
    }
}
