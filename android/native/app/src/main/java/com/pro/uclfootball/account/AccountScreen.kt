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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
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
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import android.content.ClipData
import android.content.ClipboardManager

@Composable
fun AccountRoute(
    container: UclAppContainer,
    onSelectTab: (String) -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenBets: () -> Unit,
    onOpenWallet: () -> Unit,
    onOpenDeposit: () -> Unit,
    onOpenWithdraw: () -> Unit,
    onOpenPin: () -> Unit,
    onOpenSupport: () -> Unit,
    onOpenReferrals: () -> Unit,
    onOpenVip: () -> Unit,
    onOpenWheel: () -> Unit,
    onOpenFaq: () -> Unit,
    onSignOutComplete: () -> Unit,
    onSignInRequired: () -> Unit,
) {
    val signOutScope = rememberCoroutineScope()
    val accountViewModel: AccountViewModel = viewModel(
        factory = remember(container.accountRepository, container.authSessionRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    AccountViewModel(container.accountRepository, container.authSessionRepository) as T
            }
        },
    )
    val state by accountViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(accountViewModel::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    AccountScreen(
        state = state,
        onRetry = accountViewModel::refresh,
        onSelectTab = onSelectTab,
        onOpenNotifications = onOpenNotifications,
        onOpenHistory = onOpenHistory,
        onOpenBets = onOpenBets,
        onOpenWallet = onOpenWallet,
        onOpenDeposit = onOpenDeposit,
        onOpenWithdraw = onOpenWithdraw,
        onOpenPin = onOpenPin,
        onOpenSupport = onOpenSupport,
        onOpenReferrals = onOpenReferrals,
        onOpenVip = onOpenVip,
        onOpenWheel = onOpenWheel,
        onOpenFaq = onOpenFaq,
        onSignOutComplete = {
            signOutScope.launch {
                container.pushManager.unregister()
                runCatching { container.authSessionRepository.signOut() }
                onSignOutComplete()
            }
        },
    )
}

@Composable
private fun AccountScreen(
    state: AccountUiState,
    onRetry: () -> Unit,
    onSelectTab: (String) -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenBets: () -> Unit,
    onOpenWallet: () -> Unit,
    onOpenDeposit: () -> Unit,
    onOpenWithdraw: () -> Unit,
    onOpenPin: () -> Unit,
    onOpenSupport: () -> Unit,
    onOpenReferrals: () -> Unit,
    onOpenVip: () -> Unit,
    onOpenWheel: () -> Unit,
    onOpenFaq: () -> Unit,
    onSignOutComplete: () -> Unit,
) {
    Scaffold(
        contentWindowInsets = WindowInsets.statusBars,
        containerColor = UclColors.paper,
        bottomBar = { NativeBottomBar("account", onSelectTab) },
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()),
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(stringResource(R.string.account_profile_title), color = UclColors.ink, fontFamily = FontFamily.Serif, fontSize = 32.sp)
                when {
                    state.isLoading -> AccountNotice(stringResource(R.string.account_loading))
                    state.error != null -> Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        AccountNotice(stringResource(if (state.error == AccountError.Network) R.string.account_error_network else R.string.account_error_general))
                        TextButton(onClick = onRetry) { Text(stringResource(R.string.common_retry), color = UclColors.accent) }
                    }
                    state.response?.profile != null -> {
                        val response = requireNotNull(state.response)
                        val profile = response.profile
                        val username = profile.username?.takeIf(String::isNotBlank) ?: stringResource(R.string.account_unknown_user)
                        val vipLevel = remember(response.vip) {
                            runCatching { response.vip?.jsonObject?.get("viplevel")?.jsonPrimitive?.intOrNull }.getOrNull() ?: 1
                        }
                        val referralCount = response.referralCount ?: 0
                        val balance = scalar(profile.balance)
                        val clipboard = LocalContext.current.getSystemService(ClipboardManager::class.java)
                        var copied by remember { mutableStateOf(false) }
                        val scope = rememberCoroutineScope()

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = UclColors.blueSurface),
                        ) {
                            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Surface(shape = CircleShape, color = UclColors.accent) {
                                        Text(
                                            username.take(2).uppercase(),
                                            modifier = Modifier.padding(13.dp),
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                        )
                                    }
                                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                        Text(stringResource(R.string.account_greeting), color = UclColors.muted, fontSize = 12.sp)
                                        Text(username, color = UclColors.ink, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                        Text(
                                            stringResource(R.string.account_vip_referrals, vipLevel, referralCount),
                                            color = UclColors.muted,
                                            fontSize = 12.sp,
                                        )
                                    }
                                }
                                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                    Text(stringResource(R.string.account_balance), color = UclColors.muted, fontSize = 12.sp)
                                    val balanceText = when {
                                        BuildConfig.CURRENCY_LABEL.isBlank() -> stringResource(R.string.account_currency_pending)
                                        balance == null -> stringResource(R.string.account_amount_unavailable)
                                        else -> "$balance ${BuildConfig.CURRENCY_LABEL}"
                                    }
                                    Text(balanceText, color = UclColors.ink, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = onOpenDeposit,
                                            shape = RoundedCornerShape(22.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = UclColors.accent),
                                        ) { Text(stringResource(R.string.account_deposit), color = Color.White) }
                                        Button(
                                            onClick = onOpenWithdraw,
                                            shape = RoundedCornerShape(22.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = UclColors.ink),
                                            border = BorderStroke(1.dp, UclColors.dashboardLine),
                                        ) { Text(stringResource(R.string.account_withdraw)) }
                                    }
                                }
                            }
                        }

                        AccountSection(stringResource(R.string.account_bets_heading)) {
                            AccountAction(stringResource(R.string.account_my_bets), onOpenBets)
                            AccountAction(stringResource(R.string.account_payment_history), onOpenHistory)
                        }
                        AccountSection(stringResource(R.string.account_referral_heading)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Text(stringResource(R.string.account_referral_code), color = UclColors.muted, fontSize = 12.sp)
                                    Text(profile.newrefer?.takeIf(String::isNotBlank) ?: "—", color = UclColors.ink, fontWeight = FontWeight.SemiBold)
                                }
                                TextButton(
                                    enabled = !profile.newrefer.isNullOrBlank(),
                                    onClick = {
                                        profile.newrefer?.let { code ->
                                            clipboard?.setPrimaryClip(ClipData.newPlainText("Referral code", code))
                                            copied = true
                                            scope.launch {
                                                kotlinx.coroutines.delay(2000)
                                                copied = false
                                            }
                                        }
                                    },
                                ) {
                                    Text(stringResource(if (copied) R.string.account_copied else R.string.account_copy), color = UclColors.accent)
                                }
                            }
                            AccountAction(stringResource(R.string.referrals_title), onOpenReferrals)
                        }
                        AccountSection(stringResource(R.string.account_updates_heading)) {
                            AccountAction(stringResource(R.string.account_notifications), onOpenNotifications)
                            AccountAction(stringResource(R.string.faq_title), onOpenFaq)
                            AccountAction(stringResource(R.string.journey_support), onOpenSupport)
                            AccountAction(stringResource(R.string.journey_wallet), onOpenWallet)
                            AccountAction(stringResource(R.string.journey_pin), onOpenPin)
                        }
                        AccountSection(stringResource(R.string.account_rewards_heading)) {
                            AccountAction(stringResource(R.string.account_vip), onOpenVip)
                            AccountAction(stringResource(R.string.account_wheel), onOpenWheel)
                        }
                        Spacer(Modifier.height(4.dp))
                        Button(
                            onClick = onSignOutComplete,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(26.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFF2EF), contentColor = UclColors.error),
                        ) { Text(stringResource(R.string.native_sign_out), fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
    }
}

@Composable
private fun AccountSection(title: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, color = UclColors.ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            color = Color.White,
            border = BorderStroke(1.dp, UclColors.dashboardLine),
        ) {
            Column(Modifier.padding(horizontal = 14.dp, vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                content()
            }
        }
    }
}

@Composable
private fun AccountAction(label: String, onClick: () -> Unit) {
    TextButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(48.dp),
        contentPadding = PaddingValues(horizontal = 4.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(label, color = UclColors.ink, fontWeight = FontWeight.SemiBold)
            Text(stringResource(R.string.account_open), color = UclColors.muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun AccountNotice(message: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = BorderStroke(1.dp, UclColors.dashboardLine),
    ) { Text(message, modifier = Modifier.padding(20.dp), color = UclColors.muted) }
}

private fun scalar(value: kotlinx.serialization.json.JsonElement?): String? =
    value?.let { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }?.takeIf(String::isNotBlank)
