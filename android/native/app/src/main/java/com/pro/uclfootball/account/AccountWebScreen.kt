package com.pro.uclfootball.account

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.home.CustomerLinks
import com.pro.uclfootball.home.WebTextLink
import com.pro.uclfootball.network.textValue
import com.pro.uclfootball.ui.*
import kotlinx.serialization.json.*

@Composable
internal fun WebAccountScreen(state: AccountUiState, onRetry: () -> Unit, onNavigate: (String) -> Unit, links: CustomerLinks, onSignOut: () -> Unit) {
    val response = state.response
    val profile = response?.profile
    val username = profile?.username ?: state.cachedUsername ?: webCopy(if (state.isLoading) "status.pending" else "common.account")
    val vip = runCatching { response?.vip?.jsonObject?.get("viplevel")?.jsonPrimitive?.intOrNull }.getOrNull() ?: 1
    val context = LocalContext.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp)) {
        WebBack(webCopy("common.back")) { onNavigate("home") }
        Text(webCopy("common.profile"), Modifier.padding(top = 16.dp, bottom = 24.dp), fontFamily = FontFamily.Serif, fontSize = 36.sp, lineHeight = 39.sp, letterSpacing = (-.9).sp)
        if (state.error != null && profile == null) {
            WebEmpty(webCopy("messages.unableLoadProfile"), "", color = UclColors.errorSurface, height = 160)
            TextButton(onClick = onRetry) { Text(webCopy("mobile.transactions.retry")) }
            if (state.cachedUsername == null) return@Column
        }
        Surface(color = Color(0xFF102451), shape = RoundedCornerShape(16.dp)) {
            Column(Modifier.fillMaxWidth().padding(24.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.Top) {
                    Surface(Modifier.size(64.dp), shape = CircleShape, color = UclColors.blueSurface, border = BorderStroke(1.dp, Color(0xFFA9B9D3))) {
                        Box(contentAlignment = Alignment.Center) { Text(username.split(' ').take(2).mapNotNull { it.firstOrNull() }.joinToString("").uppercase(), color = Color(0xFF102451), fontFamily = FontFamily.Serif, fontSize = 28.sp) }
                    }
                    Column(Modifier.weight(1f).padding(top = 4.dp)) {
                        Text(webCopy("mobile.profile.hello"), color = Color(0xFFD7E2ED), fontSize = 14.sp)
                        Text(username, Modifier.padding(top = 4.dp), color = Color.White, fontFamily = FontFamily.Serif, fontSize = 32.sp, lineHeight = 35.sp)
                        if (response != null) Text(webCopy("mobile.profile.vipReferralLine", "level" to vip, "count" to (response.referralCount ?: 0)), Modifier.padding(top = 16.dp), color = Color(0xFFD7E2ED), fontSize = 14.sp, lineHeight = 21.sp)
                    }
                }
                Spacer(Modifier.height(24.dp)); HorizontalDivider(color = Color(0xFF59708B)); Spacer(Modifier.height(24.dp))
                Text(webCopy("common.currentBalance"), color = Color(0xFFD7E2ED), fontSize = 14.sp)
                Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.Bottom) {
                    Text(if (profile == null) "—" else profile.balance.textValue(), color = Color.White, fontFamily = FontFamily.Serif, fontSize = 36.sp)
                    if (profile != null) Text("MMK", Modifier.padding(start = 8.dp, bottom = 4.dp), color = Color(0xFFD7E2ED), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
                Row(Modifier.padding(top = 24.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccountHeroAction(webCopy("common.deposit"), "arrow_down_to_line", true) { onNavigate("wallet") }
                    AccountHeroAction(webCopy("common.withdraw"), "arrow_up_from_line", false) { onNavigate("withdraw") }
                }
            }
        }
        Spacer(Modifier.height(24.dp))
        AccountGroup(webCopy("mobile.profile.betsTitle"), "trophy") {
            AccountRow(webCopy("common.myBets"), "trophy") { onNavigate("bets") }
            AccountRow(webCopy("mobile.profile.history"), "history") { onNavigate("transactions") }
        }
        Spacer(Modifier.height(16.dp))
        AccountGroup(webCopy("common.account"), "wallet") {
            listOf(Triple("mobile.profile.fundAccount", "arrow_down_to_line", "wallet"), Triple("common.withdraw", "arrow_up_from_line", "withdraw"),
                Triple("mobile.profile.linkWallets", "link2", "bind-wallet"), Triple("mobile.profile.codeSetting", "lock_keyhole", "pin"),
                Triple("mobile.profile.vipProgress", "shield_check", "vip"), Triple("website.spinWheel", "sparkles", "wheel")).forEach { (key, icon, route) ->
                AccountRow(webCopy(key), icon) { onNavigate(route) }
            }
        }
        Spacer(Modifier.height(16.dp))
        Surface(color = UclColors.blueSurface, shape = RoundedCornerShape(16.dp)) {
            Column(Modifier.fillMaxWidth().padding(20.dp)) {
                AccountGroupHeading(webCopy("mobile.profile.referrals"), "users_round")
                Row(Modifier.padding(top = 24.dp).fillMaxWidth().background(Color.White, RoundedCornerShape(10.dp)).border(1.dp, UclColors.dashboardLine, RoundedCornerShape(10.dp)).padding(start = 16.dp, end = 4.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    val referralUrl = profile?.newrefer?.let { "https://europeanfc01.com/register/$it" }.orEmpty()
                    Text(referralUrl.ifBlank { "â€”" }, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                    var copied by remember { mutableStateOf(false) }
                    LaunchedEffect(copied) { if (copied) { kotlinx.coroutines.delay(2000); copied = false } }
                    Surface(onClick = { if (referralUrl.isNotBlank()) {
                        context.getSystemService(ClipboardManager::class.java)?.setPrimaryClip(ClipData.newPlainText("Invite link", referralUrl)); copied = true
                    } }, enabled = referralUrl.isNotBlank(), modifier = Modifier.size(44.dp), color = Color(0xFF102451), shape = RoundedCornerShape(8.dp)) {
                        Box(contentAlignment = Alignment.Center) { WebIcon(if (copied) "check" else "copy", tint = Color.White, description = webCopy("common.copy")) }
                    }
                }
                WebTextLink(webCopy("mobile.profile.allReferral"), modifier = Modifier.padding(top = 16.dp)) { onNavigate("referrals") }
            }
        }
        Spacer(Modifier.height(16.dp))
        fun openLink(url: String) { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }
        AccountGroup(webCopy("mobile.profile.aboutTitle"), "circle_help") {
            AccountRow(webCopy("common.faq"), "circle_help") { onNavigate("faq") }
            AccountRow(webCopy("mobile.profile.customerService"), "message_circle") { openLink(links.customerSupportUrl) }
            AccountRow(webCopy("mobile.profile.contact"), "message_circle") { openLink(links.customerSupportUrl) }
        }
        Spacer(Modifier.height(16.dp))
        AccountGroup(webCopy("mobile.profile.telegramGroup"), "send") {
            AccountRow(webCopy("mobile.profile.telegramChannel"), "send") { openLink(links.telegramGroupUrl) }
            AccountRow(webCopy("mobile.profile.telegramGroup"), "users_round") { openLink(links.telegramGroupUrl) }
            AccountRow(webCopy("mobile.profile.whatsappGroup"), "message_circle") { openLink(links.whatsappGroupUrl) }
        }
        Spacer(Modifier.height(24.dp)); HorizontalDivider(color = UclColors.dashboardLine)
        Row(Modifier.fillMaxWidth().padding(vertical = 20.dp), horizontalArrangement = Arrangement.End) {
            OutlinedButton(onSignOut, shape = RoundedCornerShape(8.dp), border = BorderStroke(1.dp, UclColors.dashboardLine)) {
                WebIcon("log_out"); Spacer(Modifier.width(12.dp)); Text(webCopy("common.signOut"), color = UclColors.ink, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(24.dp)); WebIcon("chevron_right", tint = UclColors.secondary)
            }
        }
    }
}

@Composable private fun AccountHeroAction(label: String, icon: String, primary: Boolean, onClick: () -> Unit) {
    Surface(onClick, color = if (primary) Color.White else Color.Transparent, shape = RoundedCornerShape(8.dp), border = BorderStroke(1.dp, Color.White)) {
        Row(Modifier.heightIn(min = 48.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            WebIcon(icon, Modifier.size(18.dp), if (primary) Color(0xFF102451) else Color.White)
            Text(label, color = if (primary) Color(0xFF102451) else Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}
@Composable private fun AccountGroup(title: String, icon: String, content: @Composable ColumnScope.() -> Unit) {
    WebPanel {
        AccountGroupHeading(title, icon); Spacer(Modifier.height(16.dp)); HorizontalDivider(color = UclColors.dashboardLine)
        content()
    }
}
@Composable private fun AccountGroupHeading(title: String, icon: String) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f), fontFamily = FontFamily.Serif, fontSize = 24.sp, lineHeight = 28.sp)
        WebIcon(icon, Modifier.size(23.dp), UclColors.secondary)
    }
}
@Composable private fun AccountRow(label: String, icon: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 64.dp).clickable(onClick = onClick).padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(40.dp).background(UclColors.blueSurface, RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) { WebIcon(icon, Modifier.size(21.dp), UclColors.secondary) }
        Text(label, Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.Bold, lineHeight = 22.sp)
        WebIcon("chevron_right", tint = UclColors.secondary)
    }
    HorizontalDivider(color = UclColors.dashboardLine)
}

