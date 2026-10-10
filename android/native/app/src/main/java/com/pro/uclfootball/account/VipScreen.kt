package com.pro.uclfootball.account

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
import com.pro.uclfootball.ui.UclColors
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Composable
fun VipRoute(
    container: UclAppContainer,
    onBack: () -> Unit,
    onSelectTab: (String) -> Unit,
    onSignInRequired: () -> Unit,
) {
    val viewModel: VipViewModel = viewModel(
        factory = remember(container.accountRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    VipViewModel(container.accountRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(viewModel::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()),
        ) {
            Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                TextButton(onClick = onBack, contentPadding = PaddingValues(horizontal = 0.dp, vertical = 4.dp)) {
                    Text(stringResource(R.string.vip_back), color = UclColors.ink)
                }
                Text(stringResource(R.string.vip_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp)
                when {
                    state.isLoading -> VipNotice(stringResource(R.string.vip_loading))
                    state.error != null -> Column {
                        VipNotice(stringResource(if (state.error == AccountError.Network) R.string.account_error_network else R.string.account_error_general))
                        TextButton(onClick = viewModel::refresh) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                    state.response != null -> {
                        val response = requireNotNull(state.response)
                        val profile = response.profile
                        val vip = remember(response.vip) { runCatching { response.vip?.jsonObject }.getOrNull() }
                        val level = vip?.get("viplevel")?.let { runCatching { it.jsonPrimitive.contentOrNull?.toIntOrNull() }.getOrNull() } ?: 1
                        val dailyRate = vip?.get("dailyRate")?.let { runCatching { it.jsonPrimitive.doubleOrNull }.getOrNull() }
                        val depositProgress = vip?.get("depositProgress")?.let { runCatching { it.jsonPrimitive.doubleOrNull }.getOrNull() }
                        val referralProgress = vip?.get("referralProgress")?.let { runCatching { it.jsonPrimitive.doubleOrNull }.getOrNull() }
                        val depositLimit = vip?.get("depositLimit")?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }
                        val referralLimit = vip?.get("referralLimit")?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }
                        val currentDeposits = profile.totald?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }
                        val balance = profile.balance?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }
                        val referrals = response.referralCount ?: 0
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(18.dp),
                            color = UclColors.darkGround,
                            border = BorderStroke(1.dp, UclColors.accent.copy(alpha = 0.35f)),
                        ) {
                            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                Text(stringResource(R.string.vip_level, level), color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(stringResource(R.string.account_balance), color = Color.White.copy(alpha = 0.75f), fontSize = 12.sp)
                                        Text(
                                            when {
                                                BuildConfig.CURRENCY_LABEL.isBlank() -> stringResource(R.string.account_currency_pending)
                                                balance.isNullOrBlank() -> stringResource(R.string.account_amount_unavailable)
                                                else -> "$balance ${BuildConfig.CURRENCY_LABEL}"
                                            },
                                            color = Color.White,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                        )
                                    }
                                    Column(horizontalAlignment = androidx.compose.ui.Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(stringResource(R.string.vip_daily_rate), color = Color.White.copy(alpha = 0.75f), fontSize = 12.sp)
                                        Text(dailyRate?.let { String.format("%.2f%%", it * 100) } ?: "—", color = Color(0xFF87D8FF), fontSize = 19.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                        VipProgressCard(
                            title = stringResource(R.string.vip_deposit_progress),
                            detail = when {
                                BuildConfig.CURRENCY_LABEL.isBlank() -> stringResource(R.string.account_currency_pending)
                                currentDeposits.isNullOrBlank() || depositLimit.isNullOrBlank() -> stringResource(R.string.account_amount_unavailable)
                                else -> stringResource(R.string.vip_deposit_values, currentDeposits, depositLimit, BuildConfig.CURRENCY_LABEL)
                            },
                            progress = depositProgress,
                        )
                        VipProgressCard(
                            title = stringResource(R.string.vip_referral_progress),
                            detail = stringResource(R.string.vip_referral_values, referrals, referralLimit ?: "0"),
                            progress = referralProgress,
                        )
                        VipNotice(stringResource(R.string.vip_server_authoritative_note))
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun VipProgressCard(title: String, detail: String, progress: Double?) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(title, color = UclColors.ink, fontWeight = FontWeight.SemiBold)
                Text(progress?.let { String.format("%.1f%%", it) } ?: "—", color = UclColors.ink, fontWeight = FontWeight.Bold)
            }
            LinearProgressIndicator(
                progress = { ((progress ?: 0.0).coerceIn(0.0, 100.0) / 100.0).toFloat() },
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = UclColors.accent,
                trackColor = UclColors.surface,
            )
            Text(detail, color = UclColors.muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun VipNotice(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(18.dp), color = UclColors.muted) }
}
