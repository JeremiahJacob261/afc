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
    val hasContent: Boolean = false,
    val response: MeResponse? = null,
    val error: AccountError? = null,
    val requiresSignIn: Boolean = false,
    val cachedUsername: String? = null,
)

enum class AccountError { Network, General }

class AccountViewModel(
    private val repository: AccountRepository,
    private val authSessionRepository: AuthSessionRepository,
    private val identityCache: com.pro.uclfootball.cache.CustomerIdentityCache,
) : ViewModel() {
    private val mutableState = MutableStateFlow(AccountUiState())
    val state: StateFlow<AccountUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = !it.hasContent, error = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                val userId = authSessionRepository.currentSession()?.user?.id
                mutableState.update { it.copy(cachedUsername = identityCache.username(userId)) }
                val response = repository.getProfile(onCached = { saved ->
                    mutableState.update { it.copy(isLoading = false, hasContent = true, response = saved) }
                })
                if (authSessionRepository.currentSession()?.user?.id == userId) identityCache.update(userId, response.profile.username)
                mutableState.update { it.copy(isLoading = false, hasContent = true, response = response) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401) {
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
