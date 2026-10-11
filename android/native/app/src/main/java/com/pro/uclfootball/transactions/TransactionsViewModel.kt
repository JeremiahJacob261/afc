package com.pro.uclfootball.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.ApiException
import com.pro.uclfootball.network.TransactionDto
import com.pro.uclfootball.network.TransactionSummaryDto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class TransactionsUiState(
    val isLoading: Boolean = true,
    val hasContent: Boolean = false,
    val transactions: List<TransactionDto> = emptyList(),
    val summary: TransactionSummaryDto? = null,
    val error: TransactionsError? = null,
    val requiresSignIn: Boolean = false,
)

enum class TransactionsError { Network, General }

class TransactionsViewModel(
    private val repository: TransactionsRepository,
    private val authSessionRepository: AuthSessionRepository,
) : ViewModel() {
    private val mutableState = MutableStateFlow(TransactionsUiState())
    val state: StateFlow<TransactionsUiState> = mutableState.asStateFlow()

    init { refresh() }

    fun refresh() {
        mutableState.update { it.copy(isLoading = !it.hasContent, error = null, requiresSignIn = false) }
        viewModelScope.launch {
            try {
                val response = repository.getTransactions(onCached = { saved ->
                    mutableState.update { it.copy(isLoading = false, hasContent = true, transactions = saved.transactions.ifEmpty { saved.data }, summary = saved.summary) }
                })
                mutableState.update {
                    it.copy(
                        isLoading = false, hasContent = true,
                        transactions = response.transactions.ifEmpty { response.data },
                        summary = response.summary,
                    )
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: ApiException) {
                if (error.httpStatus == 401) {
                    mutableState.update { it.copy(isLoading = false, requiresSignIn = true) }
                } else {
                    mutableState.update { it.copy(isLoading = false, error = TransactionsError.General) }
                }
            } catch (error: IOException) {
                mutableState.update { it.copy(isLoading = false, error = TransactionsError.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isLoading = false, error = TransactionsError.General) }
            }
        }
    }
}
