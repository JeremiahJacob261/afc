package com.pro.uclfootball.referrals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.MyReferralsResponse
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class ReferralsUiState(
    val isLoading: Boolean = true,
    val hasContent: Boolean = false,
    val response: MyReferralsResponse? = null,
    val error: ReferralsError? = null,
    val requiresSignIn: Boolean = false,
)

enum class ReferralsError { Network, General }

class ReferralsViewModel(
    private val repository: ReferralsRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(ReferralsUiState())
    val state: StateFlow<ReferralsUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = !it.hasContent, error = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                val response = repository.getReferrals(onCached = { saved ->
                    mutableState.update { it.copy(isLoading = false, hasContent = true, response = saved) }
                })
                mutableState.update { it.copy(isLoading = false, hasContent = true, response = response) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401) {
                    mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
                } else {
                    mutableState.update { it.copy(isLoading = false, error = ReferralsError.General) }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = ReferralsError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = ReferralsError.General) }
            }
        }
    }
}
