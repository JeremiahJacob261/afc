package com.pro.uclfootball.match

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.network.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class FixturesUiState(val loading: Boolean = true, val matches: List<MatchSummaryDto> = emptyList(),
    val error: Boolean = false, val hasContent: Boolean = false, val requiresSignIn: Boolean = false)

class MatchesViewModel(private val repository: FixturesRepository) : ViewModel() {
    private val mutableState = MutableStateFlow(FixturesUiState())
    val state = mutableState.asStateFlow()
    init { resume() }
    fun refresh() = load(false)
    fun resume() = load(true)
    private fun load(oncePerForeground: Boolean) {
        mutableState.update { it.copy(loading = true, error = false) }
        viewModelScope.launch {
            try {
                val matches = repository.load(oncePerForeground = oncePerForeground) { saved ->
                    mutableState.update { it.copy(matches = saved, hasContent = true, loading = false) }
                }
                mutableState.update { it.copy(matches = matches, hasContent = true, loading = false, error = false) }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { mutableState.update { it.copy(loading = false, error = true,
                requiresSignIn = e is ApiException && e.httpStatus == 401) } }
        }
    }
}
