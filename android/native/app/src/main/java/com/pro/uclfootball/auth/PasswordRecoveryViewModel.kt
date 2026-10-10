package com.pro.uclfootball.auth

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.BuildConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException

data class PasswordRecoveryUiState(
    val email: String = "",
    val password: String = "",
    val confirmation: String = "",
    val recoveryAccessToken: String? = null,
    val isSubmitting: Boolean = false,
    val requestSent: Boolean = false,
    val message: PasswordRecoveryMessage? = null,
)

enum class PasswordRecoveryMessage {
    EmailRequired,
    RecoverySent,
    PasswordRequired,
    PasswordMismatch,
    InvalidRecoveryLink,
    PasswordUpdated,
    Network,
    General,
}

class PasswordRecoveryViewModel(private val authClient: SupabaseAuthClient) : ViewModel() {
    private val mutableState = MutableStateFlow(PasswordRecoveryUiState())
    val state: StateFlow<PasswordRecoveryUiState> = mutableState.asStateFlow()

    fun setEmail(value: String) = mutableState.update { it.copy(email = value, message = null) }
    fun setPassword(value: String) = mutableState.update { it.copy(password = value, message = null) }
    fun setConfirmation(value: String) = mutableState.update { it.copy(confirmation = value, message = null) }

    fun handleRecoveryLink(uri: Uri) {
        if (mutableState.value.recoveryAccessToken != null) return
        val token = recoveryAccessTokenFrom(uri)
        mutableState.update {
            it.copy(
                recoveryAccessToken = token,
                message = if (token == null) PasswordRecoveryMessage.InvalidRecoveryLink else null,
            )
        }
    }

    fun sendRecoveryEmail() {
        val email = mutableState.value.email.trim()
        if (email.isBlank()) {
            mutableState.update { it.copy(message = PasswordRecoveryMessage.EmailRequired) }
            return
        }
        mutableState.update { it.copy(isSubmitting = true, message = null) }
        viewModelScope.launch {
            try {
                authClient.sendPasswordRecovery(email, BuildConfig.AUTH_REDIRECT_URI)
                mutableState.update {
                    it.copy(isSubmitting = false, requestSent = true, message = PasswordRecoveryMessage.RecoverySent)
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: IOException) {
                mutableState.update { it.copy(isSubmitting = false, message = PasswordRecoveryMessage.Network) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isSubmitting = false, message = PasswordRecoveryMessage.General) }
            }
        }
    }

    fun updatePassword() {
        val current = mutableState.value
        val token = current.recoveryAccessToken
        if (token.isNullOrBlank()) {
            mutableState.update { it.copy(message = PasswordRecoveryMessage.InvalidRecoveryLink) }
            return
        }
        if (current.password.isBlank()) {
            mutableState.update { it.copy(message = PasswordRecoveryMessage.PasswordRequired) }
            return
        }
        if (current.password != current.confirmation) {
            mutableState.update { it.copy(message = PasswordRecoveryMessage.PasswordMismatch) }
            return
        }
        val password = current.password
        mutableState.update { it.copy(isSubmitting = true, message = null) }
        viewModelScope.launch {
            try {
                authClient.updatePassword(token, password)
                mutableState.update {
                    it.copy(
                        isSubmitting = false,
                        recoveryAccessToken = null,
                        password = "",
                        confirmation = "",
                        message = PasswordRecoveryMessage.PasswordUpdated,
                    )
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: IOException) {
                mutableState.update { it.copy(isSubmitting = false, message = PasswordRecoveryMessage.Network) }
            } catch (error: SupabaseAuthException) {
                val message = if (error.httpStatus == 401 || error.httpStatus == 403) {
                    PasswordRecoveryMessage.InvalidRecoveryLink
                } else {
                    PasswordRecoveryMessage.General
                }
                mutableState.update { it.copy(isSubmitting = false, recoveryAccessToken = null, message = message) }
            } catch (error: Exception) {
                mutableState.update { it.copy(isSubmitting = false, message = PasswordRecoveryMessage.General) }
            }
        }
    }

    private fun recoveryAccessTokenFrom(uri: Uri): String? {
        val expected = Uri.parse(BuildConfig.AUTH_REDIRECT_URI)
        if (uri.scheme != expected.scheme || uri.host != expected.host || uri.path != expected.path) return null
        val values = mutableMapOf<String, String>()
        uri.queryParameterNames.forEach { key -> uri.getQueryParameter(key)?.let { values[key] = it } }
        uri.fragment.orEmpty().split('&').filter(String::isNotBlank).forEach { entry ->
            val key = entry.substringBefore('=')
            val value = entry.substringAfter('=', "")
            values[Uri.decode(key)] = Uri.decode(value)
        }
        if (values["type"] != "recovery" || values["error"] != null || values["error_code"] != null) return null
        return values["access_token"]?.takeIf(String::isNotBlank)
    }
}
