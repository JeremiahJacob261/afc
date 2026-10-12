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
internal fun BulletinBetBadge(bet: PlacedBetDto) {
    val status = betState(bet)
    val tone = when (status) { "won" -> UclColors.success; "refunded" -> UclColors.accent; "lost" -> Color(0xFFA43D4A); "notStarted" -> UclColors.muted; else -> Color(0xFF805810) }
    val ground = when (status) { "won" -> UclColors.successSurface; "refunded" -> UclColors.blueSurface; "lost" -> Color(0xFFFBECEE); "notStarted" -> UclColors.surface; else -> Color(0xFFFBF2DC) }
    Text(webCopy("status.$status"), Modifier.background(ground, RoundedCornerShape(4.dp)).padding(horizontal = 8.dp, vertical = 5.dp), color = tone, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
}

@Composable
internal fun WebBetCard(bet: PlacedBetDto, onClick: () -> Unit) {
    val start = matchStartMillis(bet.tsgmt, bet.matchDate ?: bet.date, bet.matchTime ?: bet.time)
    Surface(Modifier.fillMaxWidth().clickable(onClick = onClick), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) { BulletinTeam(bet.home, bet.ihome); BulletinTeam(bet.away, bet.iaway) }
                WebIcon("chevron_right", tint = MaterialTheme.colorScheme.primary)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(Modifier.weight(1f)) { Text(webCopy("mobile.bets.pick"), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp); Text(bet.market ?: "—", fontWeight = FontWeight.Bold, fontSize = 15.sp) }
                Column(Modifier.weight(1f)) { Text(webCopy("mobile.bets.stake"), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp); Text(webMoney(bet.stake.textValue().toDoubleOrNull() ?: 0.0), fontWeight = FontWeight.Bold, fontSize = 14.sp) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(webCopy(if (betOutcome(bet) == "refunded") "bulletin.stakeReturned" else "bulletin.potentialReturn"), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
                    Text(webMoney(betPotentialReturn(bet)), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                BulletinBetBadge(bet)
            }
            val locale = LocalConfiguration.current.locales[0]
            Text(start?.let { SimpleDateFormat("dd MMM yyyy, HH:mm", locale).format(Date(it)) } ?: webCopy("common.timeToBeConfirmed"), color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
        }
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
}

@Composable internal fun WebBetTeam(name: String?, image: String?, modifier: Modifier, right: Boolean = false) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        if (!right) WebRemoteImage(image, Modifier.size(28.dp).clip(CircleShape).background(UclColors.surface))
        Text(name ?: webCopy("common.team"), Modifier.weight(1f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = if (right) androidx.compose.ui.text.style.TextAlign.End else androidx.compose.ui.text.style.TextAlign.Start)
        if (right) WebRemoteImage(image, Modifier.size(28.dp).clip(CircleShape).background(UclColors.surface))
    }
}
@Composable internal fun WebBetMetric(label: String, value: String, modifier: Modifier) {
    Surface(modifier, shape = RoundedCornerShape(8.dp), color = Color.White, contentColor = com.pro.uclfootball.ui.UclColors.ink, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
        Column(Modifier.padding(8.dp)) { Text(label, color = UclColors.muted, fontSize = 11.sp); Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold) }
    }
}
