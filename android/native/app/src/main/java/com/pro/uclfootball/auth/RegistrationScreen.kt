package com.pro.uclfootball.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.ui.*

@Composable
fun RegistrationRoute(container: UclAppContainer, referral: String = "", onLogin: () -> Unit,
    onPrivacy: () -> Unit, onTerms: () -> Unit) {
    val vm: RegistrationViewModel = viewModel(factory = remember(container, referral) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                RegistrationViewModel(RegistrationRepository(container.apiClient, container.authClient), referral) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    JourneyPage(stringResource(R.string.registration_title), onLogin) {
        JourneyFeedback(state.error)
        if (state.created) {
            Text(stringResource(R.string.registration_created))
            JourneyAction(stringResource(R.string.login_submit), onClick = onLogin)
            return@JourneyPage
        }
        if (state.awaitingConfirmation) Text(stringResource(R.string.registration_confirm_email))
        val editIdentity = !state.busy && !state.awaitingConfirmation
        JourneyField(stringResource(R.string.registration_username), state.username, { vm.field("username", it) }, enabled = editIdentity)
        JourneyField(stringResource(R.string.registration_email), state.email, { vm.field("email", it) }, KeyboardType.Email, enabled = editIdentity)
        JourneyField(stringResource(R.string.registration_dial_code), state.dialCode, { vm.field("dialCode", it) }, KeyboardType.Phone, enabled = editIdentity)
        JourneyField(stringResource(R.string.registration_phone), state.phone, { vm.field("phone", it) }, KeyboardType.Phone, enabled = editIdentity)
        JourneyField(stringResource(R.string.registration_referral), state.referral, { vm.field("referral", it) }, enabled = editIdentity)
        JourneyField(stringResource(R.string.login_password_label), state.password, { vm.field("password", it) }, KeyboardType.Password, secret = true, enabled = !state.busy)
        if (!state.awaitingConfirmation) JourneyField(stringResource(R.string.registration_confirm_password), state.confirmation,
            { vm.field("confirmation", it) }, KeyboardType.Password, secret = true, enabled = !state.busy)
        Row {
            Checkbox(state.acceptedTerms, vm::consent, enabled = !state.busy)
            Text(stringResource(R.string.registration_consent), modifier = Modifier.weight(1f))
        }
        TextButton(onClick = onTerms) { Text(stringResource(R.string.legal_terms_title)) }
        TextButton(onClick = onPrivacy) { Text(stringResource(R.string.legal_privacy_title)) }
        JourneyAction(stringResource(if (state.awaitingConfirmation) R.string.registration_complete else R.string.registration_create), busy = state.busy, onClick = vm::submit)
        TextButton(onClick = onLogin) { Text(stringResource(R.string.registration_return_login)) }
    }
}
