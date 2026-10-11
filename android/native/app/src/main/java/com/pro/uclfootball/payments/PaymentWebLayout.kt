package com.pro.uclfootball.payments

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.R
import com.pro.uclfootball.network.textValue
import com.pro.uclfootball.ui.*

@Composable
internal fun PaymentWebLayout(state: PaymentUiState, onBack: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    val step = when (state.page) { PaymentPage.Methods -> 1; PaymentPage.Amount -> 2; PaymentPage.Destination -> 3; PaymentPage.Receipt -> 4; else -> 0 }
    if (state.page in listOf(PaymentPage.DepositSuccess, PaymentPage.WithdrawalSuccess)) {
        Column(Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center, content = content)
        return
    }
    if (state.page == PaymentPage.BindWallet) {
        Column(Modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 36.dp, end = 16.dp, bottom = 32.dp)) {
            WebPanel(padding = 16) {
                Text(webCopy("mobile.profile.bindWallet"), fontFamily = FontFamily.Serif, fontSize = 32.sp)
                Spacer(Modifier.height(24.dp))
                Column(verticalArrangement = Arrangement.spacedBy(24.dp), content = content)
            }
            TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth().heightIn(min = 44.dp)) { Text(webCopy("common.back"), fontSize = 16.sp, fontWeight = FontWeight.Bold, textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline) }
        }
        return
    }
    if (step == 0) {
        val key = when (state.page) { PaymentPage.BindWallet -> "mobile.profile.bindWallet"; PaymentPage.Pin -> "mobile.profile.codeSetting"; else -> "mobile.withdraw.title" }
        JourneyPage(webCopy(key), onBack, content)
        return
    }
    val viewportWidth = LocalConfiguration.current.screenWidthDp
    val titleSize = (viewportWidth * .1f).coerceIn(36f, 48f)
    val textMeasurer = rememberTextMeasurer()
    val headingWidth = with(LocalDensity.current) {
        (textMeasurer.measure("0", style = TextStyle(fontFamily = FontFamily.Serif, fontSize = titleSize.sp)).size.width * 12).toDp()
    }
    val panelPadding = if (viewportWidth <= 400) 20 else 24
    val code = state.method?.code.orEmpty().uppercase()
    val minimum = state.method?.rates.textValue().toDoubleOrNull()?.takeIf { it > 0 }?.let { it * 5.0 }
    val titles = listOf("mobile.deposit.paymentMethod", "common.amount", "mobile.deposit.paymentDestination", "mobile.deposit.receiptUpload")
    Column(Modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            WebBack(webCopy("common.back"), onBack); Text("$step / 4", color = WebMuted, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
        Row(Modifier.padding(top = 8.dp, bottom = 32.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(4) { i ->
                val tone = if (i + 1 == step) UclColors.accent else if (i + 1 < step) UclColors.secondary else UclColors.dashboardLine
                Column(Modifier.weight(1f)) {
                    HorizontalDivider(thickness = 2.dp, color = tone); Spacer(Modifier.height(14.dp))
                    Surface(Modifier.size(24.dp), shape = CircleShape, color = if (i + 1 <= step) tone else Color.Transparent, border = BorderStroke(1.dp, tone)) {
                        Box(contentAlignment = Alignment.Center) {
                            if (i + 1 < step) WebIcon("check", Modifier.size(14.dp), Color.White)
                            else Text((i + 1).toString(), fontSize = 12.sp, color = if (i + 1 == step) Color.White else WebMuted)
                        }
                    }
                }
            }
        }
        Text(webCopy(titles[step - 1]), Modifier.widthIn(max = headingWidth), fontFamily = FontFamily.Serif, fontSize = titleSize.sp, lineHeight = (titleSize * 1.08f).sp, letterSpacing = (-titleSize * .025f).sp)
        Text(when (step) {
            1 -> webCopy("mobile.deposit.availableOptions")
            2 -> webCopy("mobile.deposit.minShort", "amount" to (minimum?.toString() ?: "—"), "currency" to code)
            3 -> webCopy("mobile.deposit.sendExactly", "amount" to "${state.amount} $code")
            else -> webCopy("mobile.deposit.receiptHint")
        }, Modifier.padding(top = 12.dp, bottom = 24.dp), color = WebMuted, fontSize = 16.sp, lineHeight = 25.sp)
        WebPanel(padding = panelPadding) { Column(Modifier.heightIn(min = (376 - panelPadding * 2).dp), verticalArrangement = Arrangement.spacedBy(12.dp), content = content) }
        Spacer(Modifier.height(24.dp))
        Image(painterResource(R.drawable.deposit_stadium), null, Modifier.fillMaxWidth().height(216.dp).clip(RoundedCornerShape(16.dp)), contentScale = ContentScale.Crop)
    }
}

@Composable
internal fun DepositMethodOption(state: PaymentUiState, method: com.pro.uclfootball.network.PaymentMethodDto, onClick: () -> Unit) {
    val selected = state.methodId == method.identity
    Surface(onClick, modifier = Modifier.fillMaxWidth().heightIn(min = 80.dp), enabled = !state.busy, shape = RoundedCornerShape(12.dp),
        color = if (selected) Color(0xFFEDF2FF) else Color.White, border = BorderStroke(1.dp, if (selected) UclColors.accent else UclColors.dashboardLine)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.size(44.dp).background(UclColors.blueSurface, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                if (method.image.isNullOrBlank()) WebIcon("credit_card", Modifier.size(24.dp), UclColors.secondary)
                else WebRemoteImage(method.image, Modifier.size(40.dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(method.name.uppercase(), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                val rate = method.rates.textValue().toDoubleOrNull()
                val minimum = rate?.takeIf { it > 0 }?.let { it * 5.0 }
                Text(if (minimum == null) webCopy("mobile.deposit.rateUnavailable") else webCopy("mobile.deposit.minShort", "amount" to java.text.DecimalFormat("0.##").format(minimum), "currency" to method.code.uppercase()), color = WebMuted, fontSize = 13.sp)
            }
            Surface(Modifier.size(24.dp), shape = CircleShape, color = if (selected) UclColors.accent else Color.Transparent, border = BorderStroke(1.dp, if (selected) UclColors.accent else UclColors.line)) {
                Box(contentAlignment = Alignment.Center) { if (selected) WebIcon("check", Modifier.size(16.dp), Color.White) }
            }
        }
    }
}
