package com.pro.uclfootball.rewards

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.pro.uclfootball.R
import com.pro.uclfootball.ui.*
import kotlin.math.*

@Composable
internal fun WheelRewardDialog(reward: WheelReward, onDismiss: () -> Unit) {
    val progress = remember(reward) { Animatable(0f) }
    LaunchedEffect(reward) {
        // Compose's animator duration scale makes this instantaneous when system animations are removed.
        progress.animateTo(1f, tween(4_800, easing = LinearEasing))
    }
    val locale = LocalConfiguration.current.locales[0]
    val amount = remember(reward.amount, locale) { java.text.NumberFormat.getNumberInstance(locale).apply { maximumFractionDigits = 3 }.format(reward.amount) }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            Surface(Modifier.padding(20.dp).widthIn(max = 380.dp).fillMaxWidth(), shape = RoundedCornerShape(28.dp), color = UclColors.ink, shadowElevation = 12.dp) {
                Box(Modifier.background(Brush.linearGradient(listOf(UclColors.ink, Color(0xFF102B65))))) {
                    RewardStars(progress.value, Modifier.matchParentSize())
                    Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 28.dp, vertical = 32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Box(Modifier.size(104.dp).background(Color(0xFF1A3B78), CircleShape), contentAlignment = Alignment.Center) {
                            if (reward.imageUrl.isNullOrBlank()) Image(painterResource(R.drawable.ucl_logo), null, Modifier.size(80.dp))
                            else WebRemoteImage(reward.imageUrl, Modifier.size(80.dp), fallback = R.drawable.ucl_logo)
                        }
                        Text(webCopy("website.spinComplete"), color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }) {
                            Text(amount, color = Color.White, fontSize = if (amount.length > 10) 36.sp else 48.sp,
                                lineHeight = if (amount.length > 10) 42.sp else 54.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
                            Text("MMK", color = Color(0xFFFFDA7A), fontSize = 16.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                        }
                        Text(webCopy("website.wheelCashWon", "amount" to webMoney(reward.amount)), color = Color(0xFFD8E5FF), fontSize = 14.sp,
                            lineHeight = 21.sp, textAlign = TextAlign.Center)
                        Button(onDismiss, Modifier.fillMaxWidth().heightIn(min = 48.dp), shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = UclColors.accent, contentColor = Color.White)) {
                            Text(webCopy("common.continue"), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RewardStars(progress: Float, modifier: Modifier) {
    val star = remember {
        Path().apply {
            repeat(10) { point ->
                val angle = -PI / 2 + point * PI / 5
                val radius = if (point % 2 == 0) 1f else .42f
                val x = cos(angle).toFloat() * radius
                val y = sin(angle).toFloat() * radius
                if (point == 0) moveTo(x, y) else lineTo(x, y)
            }
            close()
        }
    }
    Canvas(modifier) {
        if (progress >= 1f) return@Canvas
        val ending = ((1f - progress) / .15f).coerceIn(0f, 1f)
        repeat(26) { index ->
            val phase = (progress * 2f + index * .618034f) % 1f
            val angle = index * 2.399963f + phase * .5f
            val distance = 48.dp.toPx() + phase * size.width * .7f
            val x = size.width / 2 + cos(angle) * distance
            val y = size.height * .24f + sin(angle) * distance * .8f
            // Keep the credited amount and action visually quiet while stars orbit the reward.
            if (x > size.width * .18f && x < size.width * .82f && y > size.height * .43f) return@repeat
            val opacity = sin(phase * PI).toFloat().coerceIn(0f, 1f) * ending
            val radius = (3 + index % 5).dp.toPx()
            withTransform({
                translate(x, y)
                rotate(phase * 100 + index * 13f, pivot = Offset.Zero)
                scale(radius, radius, pivot = Offset.Zero)
            }) { drawPath(star, (if (index % 3 == 0) Color.White else Color(0xFFFFDA7A)).copy(alpha = opacity)) }
        }
    }
}
