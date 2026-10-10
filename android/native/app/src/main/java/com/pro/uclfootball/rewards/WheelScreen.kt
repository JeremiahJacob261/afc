package com.pro.uclfootball.rewards

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.BuildConfig
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.home.NativeBottomBar
import com.pro.uclfootball.network.WheelItemDto
import com.pro.uclfootball.ui.UclColors
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

private val wheelColors = listOf(
    Color(0xFF9BE15D), Color(0xFF56CCF2), Color(0xFFA78BFA), Color(0xFFFBBF24),
    Color(0xFFFB923C), Color(0xFFF472B6), Color(0xFFFDE68A), Color(0xFF72D6A3),
    Color(0xFF7B9EFF), Color(0xFFFF8E72), Color(0xFF79C8B3), Color(0xFFC4A1FF),
)

@Composable
fun WheelRoute(
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectTab: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val viewModel: WheelViewModel = viewModel(
        factory = remember(container.wheelRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    WheelViewModel(container.wheelRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(viewModel::refresh)
    val rotation = remember { Animatable(0f) }
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    LaunchedEffect(state.resultId) {
        val result = state.result ?: return@LaunchedEffect
        val count = state.wheel?.items?.size ?: 0
        val index = result.prizeIndex ?: return@LaunchedEffect
        if (count >= 2 && index in 0 until count) {
            val current = ((rotation.value % 360f) + 360f) % 360f
            val target = (360f - index * 360f / count) % 360f
            val delta = (target - current + 360f) % 360f
            rotation.animateTo(rotation.value + 2160f + delta, animationSpec = tween(5_000))
        }
        viewModel.finishAnimation()
    }
    val wheel = state.wheel
    val canSpin = wheel?.canSpin == true && !state.isLoading && !state.isSpinning

    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                TextButton(onClick = onBack, modifier = Modifier.align(Alignment.Start), contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp)) {
                    Text(stringResource(R.string.wheel_back), color = UclColors.ink)
                }
                Text(stringResource(R.string.wheel_title), modifier = Modifier.fillMaxWidth(), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp)
                when {
                    state.isLoading && wheel == null -> WheelNotice(stringResource(R.string.wheel_loading))
                    state.error != null && wheel == null -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        WheelNotice(stringResource(if (state.error == WheelError.Network) R.string.wheel_error_network else R.string.wheel_error_general))
                        TextButton(onClick = viewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                    wheel != null -> {
                        if (BuildConfig.CURRENCY_LABEL.isBlank()) {
                            WheelNotice(stringResource(R.string.wheel_currency_pending))
                        }
                        Box(Modifier.size(286.dp), contentAlignment = Alignment.Center) {
                            WheelCanvas(items = wheel.items, modifier = Modifier.fillMaxSize().padding(13.dp).rotate(rotation.value))
                            Canvas(Modifier.align(Alignment.TopCenter).size(width = 22.dp, height = 28.dp)) {
                                val pointer = Path().apply {
                                    moveTo(size.width / 2f, size.height)
                                    lineTo(0f, 0f)
                                    lineTo(size.width, 0f)
                                    close()
                                }
                                drawPath(pointer, color = UclColors.ink)
                            }
                            Button(
                                onClick = viewModel::spin,
                                enabled = canSpin,
                                modifier = Modifier.size(86.dp),
                                shape = CircleShape,
                                colors = ButtonDefaults.buttonColors(containerColor = UclColors.darkGround, disabledContainerColor = UclColors.muted),
                                contentPadding = PaddingValues(4.dp),
                            ) {
                                Text(
                                    stringResource(if (state.isSpinning) R.string.wheel_spinning else R.string.wheel_go),
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 18.sp,
                                )
                            }
                        }

                        when {
                            state.isSpinning -> WheelNotice(stringResource(R.string.wheel_spinning_message))
                            state.result != null && wheel.lastAmount != null -> WheelNotice(stringResource(R.string.wheel_won, displayAmount(wheel.lastAmount)))
                            state.recoveredAward != null -> WheelNotice(stringResource(R.string.wheel_recovered, state.recoveredAward!!))
                            BuildConfig.CURRENCY_LABEL.isBlank() -> Unit
                            wheel.eligible != true -> WheelNotice(stringResource(R.string.wheel_balance_required, displayAmount(wheel.minimumBalance)))
                            wheel.canSpin != true -> WheelNotice(stringResource(R.string.wheel_cooldown))
                            else -> WheelNotice(stringResource(R.string.wheel_ready))
                        }
                        if (!state.isSpinning && state.error != null) {
                            val errorMessage = when (state.error) {
                                WheelError.Network -> R.string.wheel_error_network
                                WheelError.NotEligible -> R.string.wheel_not_eligible
                                WheelError.Cooldown -> R.string.wheel_cooldown
                                WheelError.Updated -> R.string.wheel_updated
                                WheelError.General -> R.string.wheel_error_general
                                null -> R.string.wheel_error_general
                            }
                            WheelNotice(stringResource(errorMessage))
                        }
                        if (wheel.lastAmount != null && BuildConfig.CURRENCY_LABEL.isNotBlank()) {
                            WheelFact(stringResource(R.string.wheel_last_prize), displayAmount(wheel.lastAmount))
                        } else if (!wheel.lastPrize.isNullOrBlank() && BuildConfig.CURRENCY_LABEL.isNotBlank()) {
                            WheelFact(stringResource(R.string.wheel_last_prize), wheel.lastPrize)
                        }
                        if (wheel.balance != null) {
                            WheelFact(
                                stringResource(R.string.wheel_balance),
                                if (BuildConfig.CURRENCY_LABEL.isBlank()) stringResource(R.string.wheel_currency_pending) else displayAmount(wheel.balance),
                            )
                        }
                        Text(stringResource(R.string.wheel_prizes_heading), modifier = Modifier.fillMaxWidth(), color = UclColors.ink, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        wheel.items.forEachIndexed { index, item -> PrizeRow(index, item) }
                        if (state.isLoading) WheelNotice(stringResource(R.string.wheel_refreshing))
                        if (wheel.nextSpinAt != null && wheel.canSpin != true) {
                            WheelFact(stringResource(R.string.wheel_next_spin), wheel.nextSpinAt)
                        }
                    }
                }
                if (BuildConfig.CURRENCY_LABEL.isBlank()) {
                    Button(onClick = viewModel::refresh, colors = ButtonDefaults.buttonColors(containerColor = UclColors.accent)) {
                        Text(stringResource(R.string.common_refresh), color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
private fun WheelCanvas(items: List<WheelItemDto>, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        if (items.isEmpty()) return@Canvas
        val sweep = 360f / items.size
        items.forEachIndexed { index, item ->
            val configured = item.color?.takeIf { it.matches(Regex("#[0-9A-Fa-f]{6}")) }
                ?.let { runCatching { Color(android.graphics.Color.parseColor(it)) }.getOrNull() }
            drawArc(
                color = configured ?: wheelColors[index % wheelColors.size],
                startAngle = -90f + index * sweep,
                sweepAngle = sweep,
                useCenter = true,
            )
        }
        drawCircle(color = Color.White, style = Stroke(width = 4.dp.toPx()))
    }
}

@Composable
private fun PrizeRow(index: Int, item: WheelItemDto) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(18.dp).background(wheelColors[index % wheelColors.size], CircleShape))
            Text(stringResource(R.string.wheel_prize_label, index + 1), modifier = Modifier.weight(1f), color = UclColors.ink, fontSize = 13.sp)
            Text(
                if (BuildConfig.CURRENCY_LABEL.isBlank()) stringResource(R.string.wheel_currency_pending) else displayAmount(item.amount),
                color = UclColors.ink,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
            )
        }
    }
}

@Composable
private fun displayAmount(raw: kotlinx.serialization.json.JsonElement?): String {
    if (BuildConfig.CURRENCY_LABEL.isBlank()) return stringResource(R.string.wheel_currency_pending)
    val amount = scalar(raw) ?: return stringResource(R.string.wheel_amount_unavailable)
    return "$amount ${BuildConfig.CURRENCY_LABEL}"
}

private fun scalar(value: kotlinx.serialization.json.JsonElement?): String? =
    value?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }?.takeIf(String::isNotBlank)

@Composable
private fun WheelFact(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().background(Color.White, RoundedCornerShape(10.dp)).padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = UclColors.muted, fontSize = 12.sp)
        Text(value, color = UclColors.ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun WheelNotice(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(16.dp), color = UclColors.muted) }
}
