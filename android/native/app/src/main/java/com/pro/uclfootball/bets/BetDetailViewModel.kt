package com.pro.uclfootball.bets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.MyBetResponse
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class BetDetailUiState(
    val isLoading: Boolean = true,
    val hasContent: Boolean = false,
    val response: MyBetResponse? = null,
    val error: BetDetailError? = null,
    val requiresSignIn: Boolean = false,
    val notFound: Boolean = false,
)

enum class BetDetailError { Network, General }

class BetDetailViewModel(
    private val betId: String,
    private val repository: BetsRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(BetDetailUiState())
    val state: StateFlow<BetDetailUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = !it.hasContent, error = null, requiresSignIn = false, notFound = false) }
        viewModelScope.launch {
            try {
                val response = repository.getMyBet(betId, onCached = { saved ->
                    mutableState.update { it.copy(isLoading = false, hasContent = true, response = saved) }
                })
                mutableState.update { it.copy(isLoading = false, hasContent = true, response = response) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                when (error.httpStatus) {
                    401 -> {
                            mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
                    }
                    404 -> mutableState.update { it.copy(isLoading = false, notFound = true) }
                    else -> mutableState.update { it.copy(isLoading = false, error = BetDetailError.General) }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = BetDetailError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = BetDetailError.General) }
            }
        }
    }
}
