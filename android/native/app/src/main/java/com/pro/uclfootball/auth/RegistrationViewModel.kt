package com.pro.uclfootball.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.R
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.io.IOException

data class RegistrationUiState(val username: String = "", val email: String = "", val phone: String = "",
    val dialCode: String = "", val referral: String = "", val password: String = "", val confirmation: String = "",
    val acceptedTerms: Boolean = false, val busy: Boolean = false, val awaitingConfirmation: Boolean = false,
    val created: Boolean = false, val error: Int? = null)

class RegistrationViewModel(private val repository: RegistrationRepository, referral: String) : ViewModel() {
    private val mutableState = MutableStateFlow(RegistrationUiState(referral = referral))
    val state = mutableState.asStateFlow()
    fun field(field: String, value: String) {
        if (state.value.busy) return
        mutableState.update { current ->
            when (field) {
                "username" -> current.copy(username = value)
                "email" -> current.copy(email = value)
                "phone" -> current.copy(phone = value)
                "dialCode" -> current.copy(dialCode = value)
                "referral" -> current.copy(referral = value)
                "password" -> current.copy(password = value)
                "confirmation" -> current.copy(confirmation = value)
                else -> current
            }.copy(error = null)
        }
    }
    fun consent(value: Boolean) { if (!state.value.busy) mutableState.update { it.copy(acceptedTerms = value, error = null) } }
    fun submit() {
        val current = state.value
        if (current.busy || current.created) return
        val error = when {
            current.username.isBlank() || !android.util.Patterns.EMAIL_ADDRESS.matcher(current.email.trim()).matches() -> R.string.registration_invalid_identity
            current.phone.filter(Char::isDigit).length < 9 || !Regex("\\+[0-9]{1,4}").matches(current.dialCode.trim()) -> R.string.registration_invalid_phone
            !current.acceptedTerms -> R.string.registration_accept_terms
            current.password.length < 6 || (!current.awaitingConfirmation && current.password != current.confirmation) -> R.string.registration_password_mismatch
            else -> null
        }
        if (error != null) { mutableState.update { it.copy(error = error) }; return }
        mutableState.update { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val profile = SignupProfileRequest(current.username.trim(), current.phone.trim(), current.dialCode.trim(), current.referral.trim())
                val created = if (current.awaitingConfirmation) {
                    repository.completeAfterConfirmation(current.email.trim(), current.password, profile); true
                } else repository.register(current.email.trim(), current.password, profile)
                mutableState.update { it.copy(created = created, awaitingConfirmation = !created, password = "", confirmation = "") }
            } catch (error: CancellationException) { throw error }
            catch (error: UsernameUnavailable) { mutableState.update { it.copy(error = R.string.registration_username_taken) } }
            catch (error: IOException) { mutableState.update { it.copy(error = R.string.journey_offline) } }
            catch (error: Exception) { mutableState.update { it.copy(error = R.string.registration_failed) } }
            finally { mutableState.update { it.copy(busy = false) } }
        }
    }
}
