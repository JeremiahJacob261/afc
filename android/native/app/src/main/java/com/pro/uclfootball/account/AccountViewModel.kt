package com.pro.uclfootball.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.MeResponse
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class AccountUiState(
    val isLoading: Boolean = true,
    val response: MeResponse? = null,
    val error: AccountError? = null,
    val requiresSignIn: Boolean = false,
)

enum class AccountError { Network, General }

class AccountViewModel(
    private val repository: AccountRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(AccountUiState())
    val state: StateFlow<AccountUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = true, error = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                mutableState.update { it.copy(isLoading = false, response = repository.getProfile()) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401 || error.httpStatus == 404) {
                    authSessionRepository.clear()
                    mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
                } else {
                    mutableState.update { it.copy(isLoading = false, error = AccountError.General) }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = AccountError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = AccountError.General) }
            }
        }
    }
}
