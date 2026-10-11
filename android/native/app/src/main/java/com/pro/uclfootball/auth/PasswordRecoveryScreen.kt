package com.pro.uclfootball.auth

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.ui.UclColors

@Composable
fun PasswordRecoveryRoute(
    container: UclAppContainer,
    incomingLink: Uri?,
    onBackToLogin: () -> Unit,
    onLinkConsumed: () -> Unit,
) {
    val recoveryViewModel: PasswordRecoveryViewModel = viewModel(
        factory = remember(container.authClient) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    PasswordRecoveryViewModel(container.authClient) as T
            }
        },
    )
    val state by recoveryViewModel.state.collectAsStateWithLifecycle()
    LaunchedEffect(incomingLink) {
        if (incomingLink != null) {
            recoveryViewModel.handleRecoveryLink(incomingLink)
            onLinkConsumed()
        }
    }
    PasswordRecoveryScreen(
        state = state,
        onBackToLogin = onBackToLogin,
        onEmailChange = recoveryViewModel::setEmail,
        onPasswordChange = recoveryViewModel::setPassword,
        onConfirmationChange = recoveryViewModel::setConfirmation,
        onSendEmail = recoveryViewModel::sendRecoveryEmail,
        onUpdatePassword = recoveryViewModel::updatePassword,
    )
}

@Composable
private fun PasswordRecoveryScreen(
    state: PasswordRecoveryUiState,
    onBackToLogin: () -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onConfirmationChange: (String) -> Unit,
    onSendEmail: () -> Unit,
    onUpdatePassword: () -> Unit,
) {
    Scaffold(contentWindowInsets = WindowInsets.statusBars, containerColor = UclColors.paper) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())
                .imePadding().padding(horizontal = 24.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            TextButton(onClick = onBackToLogin, modifier = Modifier.align(androidx.compose.ui.Alignment.Start)) {
                Text(stringResource(R.string.reset_return_login), color = UclColors.accent)
            }
            Text(
                stringResource(R.string.reset_screen_title),
                color = UclColors.ink,
                fontFamily = FontFamily.Serif,
                fontWeight = FontWeight.Black,
                fontSize = 32.sp,
                lineHeight = 38.sp,
            )
            if (state.message == PasswordRecoveryMessage.PasswordUpdated) {
                Button(onClick = onBackToLogin, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.reset_return_login))
                }
            } else if (state.recoveryAccessToken != null) {
                OutlinedTextField(
                    value = state.password,
                    onValueChange = onPasswordChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(stringResource(R.string.reset_new_password)) },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                )
                OutlinedTextField(
                    value = state.confirmation,
                    onValueChange = onConfirmationChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(stringResource(R.string.reset_confirm_password)) },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                )
                Button(
                    onClick = onUpdatePassword,
                    enabled = !state.isSubmitting,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = UclColors.accent),
                ) {
                    Text(
                        stringResource(R.string.reset_update_password),
                        color = UclColors.paper,
                    )
                }
            } else {
                Text(stringResource(R.string.reset_screen_subtitle), color = UclColors.body, fontSize = 15.sp, lineHeight = 23.sp)
                OutlinedTextField(
                    value = state.email,
                    onValueChange = onEmailChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(stringResource(R.string.reset_email_label)) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                )
                Button(
                    onClick = onSendEmail,
                    enabled = !state.isSubmitting,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = UclColors.accent),
                ) {
                    Text(
                        stringResource(if (state.isSubmitting) R.string.reset_sending_email else R.string.reset_send_email),
                        color = UclColors.paper,
                    )
                }
            }
            RecoveryFeedback(state.message)
        }
    }
}

@Composable
private fun RecoveryFeedback(message: PasswordRecoveryMessage?) {
    val text = when (message) {
        PasswordRecoveryMessage.EmailRequired -> stringResource(R.string.reset_email_required)
        PasswordRecoveryMessage.RecoverySent -> "${stringResource(R.string.reset_email_sent_title)}. ${stringResource(R.string.reset_email_sent_message)}"
        PasswordRecoveryMessage.PasswordRequired -> stringResource(R.string.reset_password_required)
        PasswordRecoveryMessage.PasswordMismatch -> stringResource(R.string.reset_password_mismatch)
        PasswordRecoveryMessage.InvalidRecoveryLink -> stringResource(R.string.reset_invalid_link)
        PasswordRecoveryMessage.PasswordUpdated -> "${stringResource(R.string.reset_password_updated_title)}. ${stringResource(R.string.reset_password_updated_message)}"
        PasswordRecoveryMessage.Network -> stringResource(R.string.reset_error_network)
        PasswordRecoveryMessage.General -> stringResource(R.string.reset_error_general)
        null -> return
    }
    Text(
        text = text,
        color = if (message == PasswordRecoveryMessage.RecoverySent || message == PasswordRecoveryMessage.PasswordUpdated) {
            UclColors.success
        } else {
            UclColors.error
        },
        fontWeight = FontWeight.SemiBold,
        lineHeight = 22.sp,
    )
}
