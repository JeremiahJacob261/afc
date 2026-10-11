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
                    AccountViewModel(container.accountRepository, container.authSessionRepository, container.identityCache) as T
            }
        },
    )
    val state by accountViewModel.state.collectAsStateWithLifecycle()
    com.pro.uclfootball.ui.RefreshOnResume(accountViewModel::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    val links by androidx.compose.runtime.produceState(com.pro.uclfootball.home.CustomerLinks(), container) {
        try { value = container.apiClient.getJson<com.pro.uclfootball.home.CustomerSettings>("api/platform-settings").links }
        catch (e: kotlinx.coroutines.CancellationException) { throw e }
        catch (_: Exception) { }
    }
    WebAccountScreen(state, accountViewModel::refresh, onSelectTab, links) {
        signOutScope.launch {
            container.pushManager.unregister()
            runCatching { container.authSessionRepository.signOut() }
            onSignOutComplete()
        }
    }
}
