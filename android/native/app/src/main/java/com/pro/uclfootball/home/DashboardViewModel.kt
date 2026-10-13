package com.pro.uclfootball.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.MatchSummaryDto
import com.pro.uclfootball.network.MatchesResponse
import com.pro.uclfootball.network.MeResponse
import com.pro.uclfootball.network.NativeApiClient
import com.pro.uclfootball.network.MyBetsResponse
import com.pro.uclfootball.network.PlacedBetDto
import kotlinx.serialization.Serializable
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
    val referralCode: String? = null,
    val matches: List<MatchSummaryDto> = emptyList(),
    val errorMessage: String? = null,
    val requiresSignIn: Boolean = false,
    val openBets: List<PlacedBetDto> = emptyList(),
    val betsLoading: Boolean = true,
    val betsError: Boolean = false,
    val betsHasContent: Boolean = false,
    val links: CustomerLinks = CustomerLinks(),
)

@Serializable
data class CustomerLinks(
    val telegramGroupUrl: String = "https://t.me/+Giav1o1JVGNkYzNk",
    val whatsappGroupUrl: String = "https://chat.whatsapp.com/I1D6NNWndu6HDrbzB5BkPX?s=hd&p=i&mlu=0&ilr=0",
    val customerSupportUrl: String = "https://t.me/EFC_Support",
)
@Serializable data class CustomerSettings(val links: CustomerLinks = CustomerLinks())

class DashboardViewModel(
    private val apiClient: NativeApiClient,
    private val authSessionRepository: AuthSessionRepository,
    private val matchLimit: Int = 50,
    private val identityCache: com.pro.uclfootball.cache.CustomerIdentityCache,
) : ViewModel() {
    private val mutableState = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = mutableState.asStateFlow()

    init {
        load(force = true)
        loadAccountExtras()
    }

    fun refresh() { load(force = false); loadAccountExtras(oncePerForeground = false) }
    fun resume() { load(force = true); loadAccountExtras() }

    private fun loadAccountExtras(oncePerForeground: Boolean = true) {
        viewModelScope.launch {
            try {
                val bets = apiClient.getJson<MyBetsResponse>("api/my-bets", authenticated = true, oncePerForeground = oncePerForeground, onCached = { saved ->
                    mutableState.update { it.copy(openBets = saved.unsettled, betsLoading = false, betsHasContent = true) }
                })
                mutableState.update { it.copy(openBets = bets.unsettled, betsLoading = false, betsError = false, betsHasContent = true) }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { mutableState.update { it.copy(betsLoading = false, betsError = !it.betsHasContent) } }
        }
        viewModelScope.launch {
            try {
                val settings = apiClient.getJson<CustomerSettings>("api/platform-settings", oncePerForeground = oncePerForeground, onCached = { saved ->
                    mutableState.update { it.copy(links = saved.links) }
                })
                mutableState.update { it.copy(links = settings.links) }
            } catch (e: CancellationException) { throw e }
            catch (_: Exception) { /* Website fallbacks are retained. */ }
        }
    }

    private fun load(force: Boolean) {
        mutableState.update { it.copy(isLoading = it.matches.isEmpty(), errorMessage = null, requiresSignIn = false) }
        // Account failures must not cancel the independent public fixture request.
        viewModelScope.launch {
            try {
                val userId = authSessionRepository.currentSession()?.user?.id
                mutableState.update { it.copy(username = identityCache.username(userId)) }
                val profile = apiClient.getJson<MeResponse>("api/me", authenticated = true, oncePerForeground = force, onCached = { saved ->
                    mutableState.update { it.copy(username = saved.profile.username, referralCode = saved.profile.newrefer) }
                }).profile
                if (authSessionRepository.currentSession()?.user?.id == userId) {
                    identityCache.update(userId, profile.username)
                    mutableState.update { it.copy(username = profile.username, referralCode = profile.newrefer) }
                }
            } catch (e: CancellationException) { throw e }
            catch (e: ApiException) { if (e.httpStatus == 401) mutableState.update { it.copy(requiresSignIn = true) } }
            catch (_: Exception) { /* Preserve cached identity; fixture status belongs to the fixture request. */ }
        }
        viewModelScope.launch {
            try {
                val matches = com.pro.uclfootball.match.FixturesRepository(apiClient).load(matchLimit, force) { saved ->
                    mutableState.update { it.copy(matches = saved, isLoading = false) }
                }
                mutableState.update { it.copy(matches = matches, isLoading = false, errorMessage = null) }
            } catch (e: CancellationException) { throw e }
            catch (_: IOException) { setError("You are offline. Connect and retry to load current fixtures.") }
            catch (_: Exception) { setError("We could not refresh fixtures. Please retry.") }
        }
    }

    private fun setError(message: String) = mutableState.update {
        it.copy(isLoading = false, errorMessage = message)
    }
}
