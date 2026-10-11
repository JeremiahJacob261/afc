package com.pro.uclfootball.rewards

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.UclAppContainer

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
            rotation.animateTo(rotation.value + 2160f + delta, animationSpec = tween(5_200, easing = androidx.compose.animation.core.CubicBezierEasing(.12f, .72f, .13f, 1f)))
        }
        viewModel.finishAnimation()
    }
    WheelWebPage(state, rotation.value, onBack, { onSelectTab("deposit") }, viewModel::spin, viewModel::refresh)
    state.celebration?.let { WheelRewardDialog(it, viewModel::dismissCelebration) }
}
