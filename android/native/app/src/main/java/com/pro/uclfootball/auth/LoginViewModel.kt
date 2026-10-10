package com.pro.uclfootball.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class LoginUiState(
    val identity: String = "",
    val password: String = "",
    val passwordVisible: Boolean = false,
    val isCheckingSession: Boolean = false,
    val sessionRecoveryFailed: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: LoginError? = null,
    val signedIn: Boolean = false,
)

enum class LoginError {
    InvalidCredentials,
    Network,
    General,
}

class LoginViewModel(private val repository: LoginRepository) : ViewModel() {
    private val mutableState = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = mutableState.asStateFlow()

    init {
        restoreSession()
    }

    fun setIdentity(value: String) = mutableState.update {
        it.copy(identity = value.trim(), error = null)
    }

    fun setPassword(value: String) = mutableState.update {
        it.copy(password = value, error = null)
    }

    fun togglePasswordVisibility() = mutableState.update {
        it.copy(passwordVisible = !it.passwordVisible)
    }

    fun retrySessionRestore() = restoreSession()

    fun sessionEnded() { mutableState.update { LoginUiState() } }

    fun signIn() {
        val current = mutableState.value
        if (current.isSubmitting || current.identity.isBlank() || current.password.isBlank()) return

        mutableState.update { it.copy(isSubmitting = true, error = null) }
        viewModelScope.launch {
            try {
                repository.signIn(current.identity, current.password)
                mutableState.update {
                    it.copy(isSubmitting = false, isCheckingSession = false, sessionRecoveryFailed = false, signedIn = true)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: InvalidLoginCredentialsException) {
                mutableState.update {
                    it.copy(isSubmitting = false, error = LoginError.InvalidCredentials)
                }
            } catch (error: IOException) {
                mutableState.update {
                    it.copy(isSubmitting = false, error = LoginError.Network)
                }
            } catch (error: Exception) {
                mutableState.update {
                    it.copy(isSubmitting = false, error = LoginError.General)
                }
            }
        }
    }

    private fun restoreSession() {
        if (mutableState.value.isCheckingSession) return
        mutableState.update {
            it.copy(isCheckingSession = true, signedIn = false, sessionRecoveryFailed = false, error = null)
        }
        viewModelScope.launch {
            try {
                val restored = repository.restoreSession()
                mutableState.update {
                    it.copy(isCheckingSession = false, signedIn = restored)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                mutableState.update {
                    it.copy(
                        isCheckingSession = false,
                        sessionRecoveryFailed = true,
                        error = LoginError.Network,
                    )
                }
            }
        }
    }
}
