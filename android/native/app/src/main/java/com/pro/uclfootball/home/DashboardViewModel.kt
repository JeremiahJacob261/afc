package com.pro.uclfootball.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.MatchSummaryDto
import com.pro.uclfootball.network.MatchesResponse
import com.pro.uclfootball.network.MeResponse
import com.pro.uclfootball.network.NativeApiClient
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class DashboardUiState(
    val isLoading: Boolean = true,
    val username: String? = null,
    val matches: List<MatchSummaryDto> = emptyList(),
    val errorMessage: String? = null,
    val requiresSignIn: Boolean = false,
)

class DashboardViewModel(
    private val apiClient: NativeApiClient,
    private val authSessionRepository: AuthSessionRepository,
    private val matchLimit: Int = 20,
) : ViewModel() {
    private val mutableState = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = mutableState.asStateFlow()

    init {
        load(force = true)
    }

    fun refresh() = load(force = false)

    private fun load(force: Boolean) {
        if (!force && mutableState.value.isLoading) return
        mutableState.update { it.copy(isLoading = true, errorMessage = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                val (profile, matches) = coroutineScope {
                    val profileRequest = async {
                        apiClient.getJson<MeResponse>("api/me", authenticated = true).profile
                    }
                    val matchRequest = async {
                        apiClient.getJson<MatchesResponse>("api/mobile/matches?limit=$matchLimit").matches
                    }
                    profileRequest.await() to matchRequest.await()
                }
                mutableState.update {
                    it.copy(isLoading = false, username = profile.username, matches = matches)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401 || error.httpStatus == 404) {
                    authSessionRepository.clear()
                    mutableState.update {
                        it.copy(isLoading = false, requiresSignIn = true, errorMessage = null)
                    }
                } else {
                    setError("We couldn’t refresh your account or fixtures. Please retry.")
                }
            } catch (error: IOException) {
                setError("You’re offline. Connect and retry to load current fixtures.")
            } catch (error: Exception) {
                setError("We couldn’t refresh your account or fixtures. Please retry.")
            }
        }
    }

    private fun setError(message: String) = mutableState.update {
        it.copy(isLoading = false, errorMessage = message)
    }
}
