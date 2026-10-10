package com.pro.uclfootball.match

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.MatchDetailDto
import com.pro.uclfootball.network.MatchResponse
import com.pro.uclfootball.network.NativeApiClient
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

data class MatchDetailUiState(
    val isLoading: Boolean = true,
    val match: MatchDetailDto? = null,
    val error: MatchDetailError? = null,
)

enum class MatchDetailError { Network, NotFound, General }

class MatchDetailViewModel(
    private val matchId: String,
    private val apiClient: NativeApiClient,
) : ViewModel() {
    private val mutableState = MutableStateFlow(MatchDetailUiState())
    val state: StateFlow<MatchDetailUiState> = mutableState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        if (matchId.isBlank()) {
            mutableState.value = MatchDetailUiState(
                isLoading = false,
                error = MatchDetailError.NotFound,
            )
            return
        }
        mutableState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            try {
                val encodedId = URLEncoder.encode(matchId, StandardCharsets.UTF_8.name())
                val response = apiClient.getJson<MatchResponse>("api/mobile/match?id=$encodedId")
                mutableState.update { it.copy(isLoading = false, match = response.match) }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                when (error.httpStatus) {
                    404 -> mutableState.update {
                        it.copy(isLoading = false, error = MatchDetailError.NotFound)
                    }
                    else -> mutableState.update {
                        it.copy(isLoading = false, error = MatchDetailError.General)
                    }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = MatchDetailError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = MatchDetailError.General) }
            }
        }
    }
}
