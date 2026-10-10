package com.pro.uclfootball.bets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.PlacedBetDto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class BetsUiState(
    val isLoading: Boolean = true,
    val unsettled: List<PlacedBetDto> = emptyList(),
    val settled: List<PlacedBetDto> = emptyList(),
    val error: BetsError? = null,
    val requiresSignIn: Boolean = false,
)

enum class BetsError { Network, General }

class BetsViewModel(
    private val repository: BetsRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(BetsUiState())
    val state: StateFlow<BetsUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = true, error = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                val response = repository.getMyBets()
                mutableState.update {
                    it.copy(isLoading = false, unsettled = response.unsettled, settled = response.settled)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401 || error.httpStatus == 404) {
                    authSessionRepository.clear()
                    mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
                } else {
                    mutableState.update { it.copy(isLoading = false, error = BetsError.General) }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = BetsError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = BetsError.General) }
            }
        }
    }
}
