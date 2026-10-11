package com.pro.uclfootball.account

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.network.textValue
import com.pro.uclfootball.ui.*
import kotlinx.serialization.json.*

// Same informational tier table as lib/vip.js; the server determines eligibility.
private val deposits = listOf(50000, 100000, 250000, 500000, 1000000, 1500000, 2500000)
private val members = listOf(0, 3, 5, 8, 12, 15, 20)
private val rates = listOf(0.0, .0015, .003, .005, .007, .0095, .0125)
private val tierColors = listOf(0xFFA8C7FF, 0xFF56CCF2, 0xFFA78BFA, 0xFFFBBF24, 0xFFFB923C, 0xFFF472B6, 0xFFFDE68A).map { Color(it) }

@Composable internal fun WebVipPage(state: VipUiState, onBack: () -> Unit, onRetry: () -> Unit) {
    val response = state.response
    val vip = runCatching { response?.vip?.jsonObject }.getOrNull()
    val level = (vip?.get("viplevel").textValue().toIntOrNull() ?: 1).coerceIn(1, 7)
    val accent = tierColors[level - 1]
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        WebPageHeading(webCopy("mobile.profile.vipProgress"), onBack, bordered = true)
        if (state.isLoading && !state.hasContent) { CircularProgressIndicator(); return@Column }
        if (response == null) { WebEmpty(webCopy("messages.unableLoadProfile"), ""); TextButton(onRetry) { Text(webCopy("common.refresh")) }; return@Column }
        Box(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Color(0xFF142D52), Color(0xFF09182D))), RoundedCornerShape(16.dp)).border(1.dp, accent.copy(alpha = .33f), RoundedCornerShape(16.dp))) {
            Column(Modifier.padding(20.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Surface(color = accent.copy(alpha = .1f), shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, accent.copy(alpha = .27f))) {
                            Row(Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) { WebIcon("sparkles", Modifier.size(16.dp), accent); Text(webCopy("website.memberBenefits"), fontSize = 10.sp, color = accent, fontWeight = FontWeight.ExtraBold) }
                        }
                        Text("VIP $level", color = Color.White, fontSize = 31.sp, fontWeight = FontWeight.Black, lineHeight = 31.sp)
                        Text(webCopy("website.vipTeamIntro"), color = Color(0xFFB8C9DE), fontSize = 13.sp, lineHeight = 19.5.sp)
                    }
                    Box(Modifier.size(66.dp).background(accent.copy(alpha = .1f), CircleShape).border(1.dp, accent.copy(alpha = .46f), CircleShape), contentAlignment = Alignment.Center) { WebIcon("diamond", Modifier.size(38.dp), accent) }
                }
                Spacer(Modifier.height(20.dp)); HorizontalDivider(color = Color.White.copy(alpha = .12f)); Spacer(Modifier.height(20.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        WebIcon("wallet", tint = accent)
                        Column { Text(webCopy("website.currentBalance"), color = Color(0xFFD7E2ED), fontSize = 11.sp); Text(webMoney(response.profile.balance.textValue().toDoubleOrNull() ?: 0.0), color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.ExtraBold) }
                    }
                    Column(horizontalAlignment = Alignment.End) { Text(webCopy("website.dailyIncrease"), color = Color(0xFFD7E2ED), fontSize = 11.sp); Text(String.format(java.util.Locale.ROOT, "%.2f%%", (vip?.get("dailyRate").textValue().toDoubleOrNull() ?: rates[level - 1]) * 100), color = accent, fontSize = 20.sp, fontWeight = FontWeight.Black) }
                }
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(webCopy("website.yourProgress"), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold)
            VipWebProgress("website.totalDeposits", "wallet", vip?.get("depositProgress").textValue().toDoubleOrNull() ?: 0.0, Color(0xFF56CCF2), webCopy("website.vipDepositProgress", "current" to response.profile.totald.textValue(), "total" to vip?.get("depositLimit").textValue()))
            VipWebProgress("website.activeDirectDownlines", "users_round", vip?.get("referralProgress").textValue().toDoubleOrNull() ?: 0.0, Color(0xFFA78BFA), webCopy("website.vipMemberProgress", "current" to (response.referralCount ?: 0), "total" to vip?.get("referralLimit").textValue()))
        }
        WebPanel(color = UclColors.blueSurface, radius = 8, padding = 16) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                WebIcon("check", Modifier.size(21.dp), UclColors.success)
                Column { Text(webCopy("website.unlockNextTier"), fontSize = 13.sp, fontWeight = FontWeight.ExtraBold); Text(webCopy("website.vipRequirement"), Modifier.padding(top = 4.dp), color = WebMuted, fontSize = 12.sp, lineHeight = 17.sp) }
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(webCopy("website.vipTiers"), fontSize = 17.sp, fontWeight = FontWeight.ExtraBold)
                Row { WebIcon("trending_up", Modifier.size(17.dp), UclColors.success); Text(webCopy("website.dailyGrowth"), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = UclColors.success) }
            }
            repeat(7) { i ->
                val current = level == i + 1; val color = tierColors[i]
                val textTone = if (current) UclColors.accent else UclColors.secondary
                Surface(color = if (current) UclColors.blueSurface else Color.White, shape = RoundedCornerShape(8.dp), border = BorderStroke(1.dp, if (current) UclColors.accent else UclColors.dashboardLine)) {
                    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Box(Modifier.size(40.dp).background(color.copy(alpha = .125f), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) { Text("V${i + 1}", fontSize = 12.sp, fontWeight = FontWeight.Black, color = textTone) }
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) { Text("VIP ${i + 1}", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold); if (current) Text(webCopy("website.currentTier"), Modifier.padding(start = 6.dp).background(UclColors.accent, RoundedCornerShape(20.dp)).padding(horizontal = 6.dp, vertical = 2.dp), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Black) }
                            Text(webCopy("website.vipTierRequirements", "amount" to java.text.NumberFormat.getIntegerInstance().format(deposits[i]), "count" to members[i]), Modifier.padding(top = 3.dp), color = WebMuted, fontSize = 11.sp)
                        }
                        Text(String.format(java.util.Locale.ROOT, "%.2f%%", rates[i] * 100), fontSize = 14.sp, fontWeight = FontWeight.Black, color = textTone)
                    }
                }
            }
        }
    }
}
@Composable private fun VipWebProgress(key: String, icon: String, progress: Double, color: Color, detail: String) {
    WebPanel(radius = 8, padding = 16) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.size(34.dp).background(color.copy(alpha = .12f), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) { WebIcon(icon, Modifier.size(18.dp), color) }
            Text(webCopy(key), Modifier.weight(1f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(String.format(java.util.Locale.ROOT, "%.2f%%", progress), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
        }
        LinearProgressIndicator(progress = { (progress.coerceIn(0.0,100.0)/100).toFloat() }, modifier = Modifier.fillMaxWidth().padding(top = 12.dp).height(8.dp), color = color, trackColor = UclColors.surface)
        Text(detail, Modifier.padding(top = 8.dp), color = WebMuted, fontSize = 12.sp)
    }
}
