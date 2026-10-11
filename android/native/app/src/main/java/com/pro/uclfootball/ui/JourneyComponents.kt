package com.pro.uclfootball.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pro.uclfootball.R

@Composable
fun JourneyPage(title: String, onBack: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    if (LocalUserShell.current) {
        Column(Modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()).padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)) {
            WebPageHeading(title, onBack)
            content()
        }
        return
    }
    Scaffold(containerColor = UclColors.paper, contentWindowInsets = WindowInsets.safeDrawing) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)) {
            TextButton(onClick = onBack) { Text(stringResource(R.string.journey_back)) }
            Text(title, style = MaterialTheme.typography.headlineLarge, color = UclColors.ink)
            content()
        }
    }
}

@Composable
fun JourneyField(label: String, value: String, onChange: (String) -> Unit,
    keyboard: KeyboardType = KeyboardType.Text, secret: Boolean = false, enabled: Boolean = true, floatingLabel: String? = null) {
    if (LocalUserShell.current) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(label, fontSize = 12.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium, color = UclColors.ink)
            OutlinedTextField(value, onChange, modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp),
                label = floatingLabel?.let { { Text(it) } }, singleLine = true, enabled = enabled,
                shape = androidx.compose.foundation.shape.RoundedCornerShape(4.dp),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = UclColors.ink, focusedBorderColor = UclColors.accent),
                keyboardOptions = KeyboardOptions(keyboardType = keyboard),
                visualTransformation = if (secret) PasswordVisualTransformation() else VisualTransformation.None)
        }
        return
    }
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(value, onChange, modifier = Modifier.fillMaxWidth(), label = { Text(label) },
        singleLine = true, enabled = enabled, keyboardOptions = KeyboardOptions(keyboardType = keyboard),
        visualTransformation = if (secret && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        trailingIcon = if (secret) ({ TextButton(onClick = { visible = !visible }) {
            Text(stringResource(if (visible) R.string.journey_hide else R.string.journey_show))
        } }) else null)
}

@Composable
fun JourneyAction(label: String, enabled: Boolean = true, busy: Boolean = false, onClick: () -> Unit) {
    Button(onClick, enabled = enabled && !busy, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(if (LocalUserShell.current) 10.dp else 26.dp)) {
        if (busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
        else Text(label)
    }
}

@Composable
fun JourneyChoice(label: String, selected: Boolean, enabled: Boolean = true, onClick: () -> Unit) {
    OutlinedButton(onClick, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = if (selected) UclColors.blueSurface else UclColors.paper)) {
        Text(label, modifier = Modifier.weight(1f))
        RadioButton(selected, onClick = null, enabled = enabled)
    }
}

@Composable
fun JourneyFeedback(resource: Int?) {
    resource?.let { Text(stringResource(it), color = UclColors.error, style = MaterialTheme.typography.bodyMedium) }
}

@Composable
fun JourneyFact(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, color = UclColors.muted, style = MaterialTheme.typography.labelMedium)
        Text(value, color = UclColors.ink, style = MaterialTheme.typography.titleMedium)
    }
}
