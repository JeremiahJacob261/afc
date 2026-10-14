package com.pro.uclfootball.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.R
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.io.IOException
import com.pro.uclfootball.network.ApiException

data class RegistrationUiState(val username: String = "", val email: String = "", val phone: String = "",
    val country: String = "MM", val dialCode: String = "+95", val referral: String = "", val password: String = "", val confirmation: String = "",
    val acceptedTerms: Boolean = false, val busy: Boolean = false, val awaitingConfirmation: Boolean = false,
    val created: Boolean = false, val error: Int? = null, val confirmationNotice: Boolean = false)

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
                "referral" -> current.copy(referral = value)
                "password" -> current.copy(password = value)
                "confirmation" -> current.copy(confirmation = value)
                else -> current
            }.copy(error = null)
        }
    }
    fun selectCountry(country: String, dialCode: String) {
        if (!state.value.busy && !state.value.awaitingConfirmation) mutableState.update {
            it.copy(country = country, dialCode = dialCode, error = null)
        }
    }
    fun dismissError() { mutableState.update { it.copy(error = null) } }
    fun dismissConfirmationNotice() { mutableState.update { it.copy(confirmationNotice = false) } }
    fun consent(value: Boolean) { if (!state.value.busy) mutableState.update { it.copy(acceptedTerms = value, error = null) } }
    fun submit() {
        val current = state.value
        if (current.busy || current.created) return
        val error = when {
            current.username.isBlank() -> R.string.registration_enter_username
            !android.util.Patterns.EMAIL_ADDRESS.matcher(current.email.trim()).matches() -> R.string.registration_enter_email
            current.phone.filter(Char::isDigit).length < 9 -> R.string.registration_enter_phone
            !current.acceptedTerms -> R.string.registration_accept_terms
            current.password.length < 6 -> R.string.registration_password_short
            !current.awaitingConfirmation && current.password != current.confirmation -> R.string.registration_password_mismatch
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
                mutableState.update { it.copy(created = created, awaitingConfirmation = !created, confirmationNotice = !created, password = "", confirmation = "") }
            } catch (error: CancellationException) { throw error }
            catch (error: UsernameUnavailable) { mutableState.update { it.copy(error = R.string.registration_username_taken) } }
            catch (error: IOException) { mutableState.update { it.copy(error = R.string.journey_offline) } }
            catch (error: SupabaseAuthException) {
                val message = error.message.orEmpty().lowercase()
                val resource = when {
                    error.code in setOf("user_already_exists", "email_exists") || "already registered" in message -> R.string.registration_email_taken
                    error.code == "email_address_invalid" || "invalid email" in message -> R.string.registration_enter_email
                    error.code == "weak_password" || "password should be" in message -> R.string.registration_password_short
                    error.httpStatus == 429 -> R.string.journey_too_many_requests
                    error.code == "email_not_confirmed" -> R.string.registration_confirmation_failed
                    else -> R.string.registration_failed
                }
                mutableState.update { it.copy(error = resource) }
            }
            catch (error: ApiException) {
                val reason = error.failure?.message.orEmpty().lowercase()
                val resource = when {
                    error.httpStatus == 401 -> R.string.journey_session_expired
                    error.httpStatus == 429 -> R.string.journey_too_many_requests
                    "username or email already exists" in reason -> R.string.registration_account_exists
                    "invalid registration details or referral code" in reason -> R.string.registration_invalid_details
                    else -> R.string.registration_failed
                }
                mutableState.update { it.copy(error = resource) }
            }
            catch (error: Exception) { mutableState.update { it.copy(error = R.string.registration_failed) } }
            finally { mutableState.update { it.copy(busy = false) } }
        }
    }
}
