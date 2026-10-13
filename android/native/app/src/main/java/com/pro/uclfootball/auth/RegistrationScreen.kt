package com.pro.uclfootball.auth

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.ui.*
import org.json.JSONArray

private data class RegistrationCountry(val name: String, val code: String, val countryCode: String) {
    val flag: String get() = countryCode.map { character ->
        String(Character.toChars(0x1F1E6 + character.code - 'A'.code))
    }.joinToString("")
}

@Composable
private fun RegistrationCountryPicker(countryCode: String, enabled: Boolean, onSelect: (RegistrationCountry) -> Unit) {
    val context = LocalContext.current
    val countries = remember {
        val data = JSONArray(context.assets.open("registration_countries.json").bufferedReader().use { it.readText() })
        (0 until data.length()).map { index ->
            val item = data.getJSONObject(index)
            RegistrationCountry(item.getString("name"), item.getString("code"), item.getString("countryCode"))
        }.sortedWith(compareBy<RegistrationCountry> { it.countryCode != "MM" }.thenBy { it.name })
    }
    val selected = countries.firstOrNull { it.countryCode == countryCode } ?: countries.first()
    var open by remember { mutableStateOf(false) }
    var search by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.registration_dial_code), style = MaterialTheme.typography.labelMedium)
        OutlinedButton(onClick = { open = true }, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp)) {
            Text("${selected.flag}  ${selected.name}  ${selected.code}", modifier = Modifier.weight(1f))
            Text("⌄")
        }
    }
    if (open) AlertDialog(
        onDismissRequest = { open = false; search = "" },
        title = { Text(stringResource(R.string.registration_select_country)) },
        text = {
            Column {
                OutlinedTextField(search, { search = it }, label = { Text(stringResource(R.string.registration_search_country)) },
                    modifier = Modifier.fillMaxWidth(), singleLine = true)
                Spacer(Modifier.height(8.dp))
                LazyColumn(modifier = Modifier.heightIn(max = 420.dp)) {
                    items(countries.filter { search.isBlank() || it.name.contains(search.trim(), ignoreCase = true) || it.code.contains(search.trim()) || it.countryCode.contains(search.trim(), ignoreCase = true) }, key = { it.countryCode }) { item ->
                        Text("${item.flag}  ${item.name}  ${item.code}",
                            modifier = Modifier.fillMaxWidth().clickable { onSelect(item); open = false; search = "" }.padding(vertical = 14.dp, horizontal = 8.dp),
                            color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = { open = false; search = "" }) { Text(stringResource(R.string.registration_close)) } },
    )
}

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
    state.error?.let { error ->
        AlertDialog(onDismissRequest = vm::dismissError, title = { Text(stringResource(R.string.registration_problem_title)) },
            text = { Text(stringResource(error)) }, confirmButton = {
                TextButton(onClick = vm::dismissError) { Text(stringResource(R.string.registration_try_again)) }
            })
    }
    if (state.confirmationNotice) AlertDialog(onDismissRequest = vm::dismissConfirmationNotice,
        title = { Text(stringResource(R.string.registration_check_email_title)) },
        text = { Text(stringResource(R.string.registration_confirm_email)) },
        confirmButton = { TextButton(onClick = vm::dismissConfirmationNotice) { Text(stringResource(R.string.registration_close)) } })
    if (state.created) AlertDialog(onDismissRequest = onLogin,
        title = { Text(stringResource(R.string.registration_success_title)) },
        text = { Text(stringResource(R.string.registration_created)) },
        confirmButton = { TextButton(onClick = onLogin) { Text(stringResource(R.string.registration_return_login)) } })
    JourneyPage(stringResource(R.string.registration_title), onLogin) {
        if (state.created) {
            Text(stringResource(R.string.registration_created))
            JourneyAction(stringResource(R.string.login_submit), onClick = onLogin)
            return@JourneyPage
        }
        if (state.awaitingConfirmation) Text(stringResource(R.string.registration_confirm_email))
        val editIdentity = !state.busy && !state.awaitingConfirmation
        JourneyField(stringResource(R.string.registration_username), state.username, { vm.field("username", it) }, enabled = editIdentity)
        JourneyField(stringResource(R.string.registration_email), state.email, { vm.field("email", it) }, KeyboardType.Email, enabled = editIdentity)
        RegistrationCountryPicker(state.country, editIdentity) { vm.selectCountry(it.countryCode, it.code) }
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
