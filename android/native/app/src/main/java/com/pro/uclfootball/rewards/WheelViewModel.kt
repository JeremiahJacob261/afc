package com.pro.uclfootball.rewards

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.SpinWheelResponse
import com.pro.uclfootball.network.WheelStateResponse
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class WheelUiState(
    val isLoading: Boolean = true,
    val isSpinning: Boolean = false,
    val wheel: WheelStateResponse? = null,
    val result: SpinWheelResponse? = null,
    val resultId: Long = 0,
    val recoveredAward: String? = null,
    val error: WheelError? = null,
    val requiresSignIn: Boolean = false,
)

enum class WheelError { Network, General, NotEligible, Cooldown, Updated }

class WheelViewModel(
    private val repository: WheelRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(WheelUiState())
    val state: StateFlow<WheelUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        if (mutableState.value.isSpinning) return
        mutableState.update { it.copy(isLoading = true, error = null, result = null, recoveredAward = null, requiresSignIn = false) }
        viewModelScope.launch { loadState() }
    }

    fun spin() {
        val current = mutableState.value
        if (current.isLoading || current.isSpinning || current.wheel?.canSpin != true || current.wheel.revision < 1) return
        val preSpinNextAt = current.wheel.nextSpinAt
        val revision = current.wheel.revision
        mutableState.update { it.copy(isSpinning = true, error = null, result = null, recoveredAward = null) }
        viewModelScope.launch {
            try {
                val result = repository.spin(revision)
                val itemCount = mutableState.value.wheel?.items?.size ?: 0
                if (result.status != "success" || result.prizeIndex == null || result.prizeIndex !in 0 until itemCount || result.balance == null) {
                    loadState()
                    mutableState.update { it.copy(isSpinning = false, error = WheelError.General) }
                    return@launch
                }
                mutableState.update { state ->
                    val wheel = state.wheel?.copy(
                        balance = result.balance,
                        minimumBalance = result.minimumBalance ?: state.wheel.minimumBalance,
                        eligible = result.eligible ?: state.wheel.eligible,
                        canSpin = false,
                        nextSpinAt = result.nextSpinAt,
                        lastPrize = result.prize,
                        lastAmount = result.amount,
                    )
                    state.copy(
                        isLoading = false,
                        isSpinning = false,
                        wheel = wheel,
                        result = result,
                        resultId = state.resultId + 1,
                    )
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                val mapped = when (error.apiError?.status) {
                    "insufficient_balance" -> WheelError.NotEligible
                    "cooldown" -> WheelError.Cooldown
                    "wheel_updated" -> WheelError.Updated
                    else -> if (error.httpStatus == 401 || error.httpStatus == 404) null else WheelError.General
                }
                if (error.httpStatus == 401 || error.httpStatus == 404) {
                    authSessionRepository.clear()
                    mutableState.update { it.copy(isSpinning = false, requiresSignIn = true) }
                } else {
                    mutableState.update { it.copy(isSpinning = false) }
                    loadState()
                    mutableState.update { it.copy(error = mapped ?: WheelError.General) }
                }
            } catch (error: IOException) {
                recoverUncertainSpin(preSpinNextAt)
            } catch (error: Exception) {
                recoverUncertainSpin(preSpinNextAt)
            }
        }
    }

    fun finishAnimation() {
        mutableState.update { it.copy(result = null) }
    }

    private suspend fun recoverUncertainSpin(preSpinNextAt: String?) {
        mutableState.update { it.copy(isSpinning = false, isLoading = true, error = null) }
        val loaded = loadState()
        if (loaded != null && loaded.nextSpinAt != null && loaded.nextSpinAt != preSpinNextAt) {
            mutableState.update { it.copy(recoveredAward = loaded.lastPrize ?: loaded.lastAmount?.toString()) }
        } else {
            mutableState.update { it.copy(error = if (loaded == null) WheelError.Network else WheelError.General) }
        }
    }

    private suspend fun loadState(): WheelStateResponse? {
        try {
            val response = repository.getState()
            mutableState.update { it.copy(isLoading = false, wheel = response, error = null) }
            return response
        } catch (error: CancellationException) {
            throw error
        } catch (error: ApiException) {
            if (error.httpStatus == 401 || error.httpStatus == 404) {
                authSessionRepository.clear()
                mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
            } else {
                mutableState.update { it.copy(isLoading = false, error = WheelError.General) }
            }
        } catch (error: IOException) {
            mutableState.update { it.copy(isLoading = false, error = WheelError.Network) }
        } catch (error: Exception) {
            mutableState.update { it.copy(isLoading = false, error = WheelError.General) }
        }
        return null
    }
}
