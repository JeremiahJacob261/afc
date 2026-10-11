package com.pro.uclfootball.rewards

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.*
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Locale
import kotlin.math.*

private val championWheelColors = listOf(Color(0xFFDDEAFF), Color(0xFFA7C9FF), Color(0xFF5C97EE), Color(0xFF245BBF), Color(0xFF143A85), Color(0xFF0B2252))

@Composable internal fun WheelWebPage(state: WheelUiState, rotation: Float, onBack: () -> Unit, onDeposit: () -> Unit, onSpin: () -> Unit, onRetry: () -> Unit) {
    val wheel = state.wheel
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) { while (true) { delay(30_000); now = System.currentTimeMillis() } }
    val next = parseWebInstant(wheel?.nextSpinAt)
    val minutes = max(0, ceil(((next ?: now) - now) / 60000.0).toInt())
    val duration = webCopy("website.wheelDuration", "hours" to minutes / 60, "minutes" to (minutes % 60).toString().padStart(2,'0'))
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp)) {
        Row(Modifier.padding(bottom = 18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Surface(onBack, Modifier.size(44.dp), shape = RoundedCornerShape(12.dp), color = Color.White) { Box(contentAlignment = Alignment.Center) { WebIcon("arrow_left", description = webCopy("common.back")) } }
            Text(webCopy("website.wheelSpin"), fontFamily = FontFamily.Serif, fontSize = 26.sp, letterSpacing = (-.65).sp)
        }
        Column(Modifier.fillMaxWidth().background(UclColors.blueSurface, RoundedCornerShape(16.dp)).padding(start = 5.dp, top = 22.dp, end = 5.dp, bottom = 26.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(22.dp)) {
            WheelWebFrame(wheel?.items.orEmpty(), rotation, wheel?.canSpin == true && !state.isLoading && !state.isSpinning, onSpin)
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                val title = when {
                    state.isSpinning -> webCopy("website.spinning")
                    state.isLoading -> webCopy("website.checkingYourSpin")
                    wheel == null -> webCopy("website.wheelVerificationFailed")
                    state.result != null && wheel.lastAmount != null -> webCopy("website.wheelCashWon", "amount" to webMoney(wheel.lastAmount.textValue().toDoubleOrNull() ?: 0.0))
                    wheel.eligible != true -> webCopy("website.wheelBalanceRequired", "amount" to webMoney(wheel.minimumBalance.textValue().toDoubleOrNull() ?: 0.0))
                    wheel.canSpin != true -> if (wheel.lastAmount != null) webCopy("website.wheelLastSpin", "prize" to webMoney(wheel.lastAmount.textValue().toDoubleOrNull() ?: 0.0)) else webCopy("website.spinComplete")
                    else -> webCopy("website.readyToSpin")
                }
                Text(title, fontSize = if (state.isLoading || wheel == null) 14.sp else 18.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                if (wheel != null) {
                    if (wheel.eligible != true) Text(webCopy("website.wheelDeposit"), Modifier.clickable(onClick = onDeposit).padding(vertical = 8.dp), color = UclColors.accent, fontWeight = FontWeight.Bold)
                    Text(if (wheel.canSpin == true) webCopy("website.wheelFreeDailySpin") else webCopy("website.wheelNextSpin", "time" to duration), color = WebMuted, fontSize = 14.sp, textAlign = TextAlign.Center)
                    Text(webCopy("website.wheelCurrentBalance", "amount" to webMoney(wheel.balance.textValue().toDoubleOrNull() ?: 0.0)), color = WebMuted, fontSize = 14.sp, textAlign = TextAlign.Center)
                }
                if (state.error != null) Text(webCopy("website.unableToLoadTheWheelPleaseTryAgain"), color = Color(0xFFA32028), fontSize = 14.sp, textAlign = TextAlign.Center)
                if (!state.isLoading && wheel == null) OutlinedButton(onRetry, shape = RoundedCornerShape(10.dp)) { Text(webCopy("website.wheelReload")) }
            }
        }
    }
}

@Composable private fun WheelWebFrame(items: List<WheelItemDto>, rotation: Float, enabled: Boolean, onSpin: () -> Unit) {
    val spinLabel = webCopy("website.spinWheel")
    BoxWithConstraints(Modifier.fillMaxWidth().aspectRatio(1f).shadow(8.dp, CircleShape).background(Brush.linearGradient(listOf(Color(0xFFFFE866), Color(0xFFFFC425), Color(0xFFFF9A18), Color(0xFFFFDA42), Color(0xFFFFAE19))), CircleShape)) {
        val diameter = maxWidth
        Canvas(Modifier.fillMaxSize()) {
            drawCircle(Color(0xFFFFDF43), style = Stroke(width = 5.dp.toPx()))
            drawCircle(Color(0xFFE88B10), radius = size.width / 2 - 8.dp.toPx(), style = Stroke(width = 6.dp.toPx()))
            val radius = size.width * .425f
            drawCircle(Color(0xFFB96210), radius = radius + 3.dp.toPx())
            if (items.isEmpty()) drawCircle(Color(0xFFF8C522), radius = radius)
            else items.forEachIndexed { i, _ ->
                val color = championWheelColors[i % championWheelColors.size]
                drawArc(color, -90f - 180f / items.size + i * 360f / items.size + rotation, 360f / items.size, true,
                    topLeft = Offset(size.width / 2 - radius, size.height / 2 - radius), size = Size(radius * 2, radius * 2))
            }
            repeat(24) { i ->
                val angle = i * Math.PI / 12
                drawCircle(if (i % 2 == 0) Color(0xFFFFFDF3) else Color(0xFFF26D2C), radius = size.width * .0165f,
                    center = Offset(size.width * (.5 + .46 * sin(angle)).toFloat(), size.height * (.5 - .46 * cos(angle)).toFloat()))
            }
        }
        items.forEachIndexed { i, item ->
            val angle = i * 2 * Math.PI / items.size + rotation * Math.PI / 180
            val width = diameter * (min(26.0, max(15.0, 185.0 / items.size)) / 100).toFloat()
            Column(Modifier.offset(x = diameter * (.5f + .289f * sin(angle).toFloat()) - width / 2,
                y = diameter * (.5f - .289f * cos(angle).toFloat()) - diameter * .11f).width(width).height(diameter * .22f), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(webMoney(item.amount.textValue().toDoubleOrNull() ?: 0.0), Modifier.background(Color.White.copy(alpha = .94f), RoundedCornerShape(4.dp)).padding(horizontal = 4.dp, vertical = 3.dp), color = UclColors.ink, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
                item.imageUrl?.takeIf(String::isNotBlank)?.let { WebRemoteImage(it, Modifier.fillMaxWidth(.78f).weight(1f)) }
            }
        }
        Canvas(Modifier.align(Alignment.TopCenter).offset(y = diameter * .35f).size(26.dp, 23.dp)) {
            drawPath(Path().apply { moveTo(size.width / 2, 0f); lineTo(0f, size.height); lineTo(size.width, size.height); close() }, Color(0xFFFFE32B))
        }
        Box(Modifier.align(Alignment.Center).size(diameter * .2f).alpha(if (enabled) 1f else .75f).shadow(5.dp, CircleShape)
            .background(Brush.radialGradient(listOf(Color(0xFF387BFF), UclColors.accent, Color(0xFF103A99))), CircleShape)
            .border(6.dp, Color(0xFFFFE243), CircleShape).clip(CircleShape)
            .semantics { contentDescription = spinLabel }.clickable(enabled = enabled, role = androidx.compose.ui.semantics.Role.Button, onClick = onSpin), contentAlignment = Alignment.Center) {
            Text(webCopy("website.go"), color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
        }
    }
}
