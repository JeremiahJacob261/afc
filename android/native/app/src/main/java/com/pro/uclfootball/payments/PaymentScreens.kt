package com.pro.uclfootball.payments

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pro.uclfootball.R
import com.pro.uclfootball.UclAppContainer
import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.*
import java.io.File
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun PaymentFlowRoute(container: UclAppContainer, initialPage: PaymentPage = PaymentPage.Wallet,
    onBack: () -> Unit, onHistory: () -> Unit, onDone: (Boolean) -> Unit, onSignInRequired: () -> Unit) {
    val vm: PaymentViewModel = viewModel(factory = remember(container, initialPage) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                PaymentViewModel(PaymentRepository(container.apiClient), container.authSessionRepository, initialPage) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    val navigationOverride = LocalUserNavSelectionOverride.current
    DisposableEffect(navigationOverride, state.page) {
        navigationOverride?.value = if (state.page == PaymentPage.Methods) "wallet" else ""
        onDispose { navigationOverride?.value = null }
    }
    RefreshOnResume(vm::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    val back = { if (!vm.back()) onBack() }
    BackHandler { back() }
    PaymentWebLayout(state, back) {
        JourneyFeedback(state.error)
        if (state.error == R.string.journey_data_changed) TextButton(onClick = vm::refresh) { Text(stringResource(R.string.common_refresh)) }
        if (state.loading) { CircularProgressIndicator(); return@PaymentWebLayout }
        if (state.data == null) {
            JourneyAction(stringResource(R.string.common_retry), busy = state.busy, onClick = vm::refresh)
            return@PaymentWebLayout
        }
        if (state.hasPending || state.uncertain) {
            Text(stringResource(if (state.uncertain) R.string.journey_uncertain else R.string.journey_payment_pending))
            TextButton(onClick = onHistory) { Text(stringResource(R.string.transactions_title)) }
        }
        when (state.page) {
            PaymentPage.Wallet -> WalletScreen(state, vm, onHistory)
            PaymentPage.Methods -> DepositMethodScreen(state, vm)
            PaymentPage.Amount -> DepositAmountScreen(state, vm)
            PaymentPage.Destination -> DepositDestinationScreen(state, vm)
            PaymentPage.Receipt -> DepositReceiptScreen(state, vm)
            PaymentPage.DepositSuccess -> SubmissionSuccessScreen(false) { onDone(false) }
            PaymentPage.BindWallet -> BindWalletScreen(state, vm)
            PaymentPage.Withdraw -> WithdrawalScreen(state, vm)
            PaymentPage.WithdrawalReview -> WithdrawalScreen(state, vm)
            PaymentPage.WithdrawalSuccess -> SubmissionSuccessScreen(true) { onDone(true) }
            PaymentPage.Pin -> PinScreen(state, vm)
        }
    }
}

private fun title(page: PaymentPage): Int = when (page) {
    PaymentPage.Wallet -> R.string.journey_wallet
    PaymentPage.Methods -> R.string.journey_deposit_method
    PaymentPage.Amount -> R.string.journey_deposit_amount
    PaymentPage.Destination -> R.string.journey_payment_destination
    PaymentPage.Receipt -> R.string.journey_receipt
    PaymentPage.DepositSuccess -> R.string.journey_deposit_success
    PaymentPage.BindWallet -> R.string.journey_bind_wallet
    PaymentPage.Withdraw -> R.string.journey_withdraw
    PaymentPage.WithdrawalReview -> R.string.journey_review_withdrawal
    PaymentPage.WithdrawalSuccess -> R.string.journey_withdraw_success
    PaymentPage.Pin -> R.string.journey_pin
}

@Composable
private fun WalletScreen(state: PaymentUiState, vm: PaymentViewModel, onHistory: () -> Unit) {
    JourneyFact(stringResource(R.string.account_balance), "${state.profile?.balance.textValue()} MMK")
    JourneyAction(stringResource(R.string.account_deposit), enabled = !state.hasPending) { vm.go(PaymentPage.Methods) }
    JourneyAction(stringResource(R.string.account_withdraw), enabled = !state.hasPending) { vm.go(PaymentPage.Withdraw) }
    TextButton(onClick = { vm.go(PaymentPage.BindWallet) }) { Text(stringResource(R.string.journey_bind_wallet)) }
    TextButton(onClick = { vm.go(PaymentPage.Pin) }) { Text(stringResource(R.string.journey_pin)) }
    TextButton(onClick = onHistory) { Text(stringResource(R.string.transactions_title)) }
    if (state.data?.wallets.isNullOrEmpty()) Text(stringResource(R.string.journey_no_wallets))
    state.data?.wallets.orEmpty().forEach { wallet -> JourneyFact(wallet.walletnames, wallet.wallet) }
}

@Composable
private fun MethodChoices(state: PaymentUiState, vm: PaymentViewModel) {
    if (state.data?.methods.isNullOrEmpty()) Text(stringResource(R.string.journey_no_methods))
    state.data?.methods.orEmpty().filter { it.available }.forEach { method ->
        DepositMethodOption(state, method) { vm.chooseMethod(method.identity) }
    }
}

@Composable
private fun DepositMethodScreen(state: PaymentUiState, vm: PaymentViewModel) {
    MethodChoices(state, vm)
    if (state.method?.code in listOf("mmk", "fcfa", "idr")) {
        Spacer(Modifier.height(20.dp))
        Text(webCopy("mobile.deposit.transferOption"), fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val options = when (state.method?.code) { "mmk" -> listOf("Wave", "KPay"); "fcfa" -> listOf("Wave", "MTN Money"); else -> listOf("DANA") }
            options.forEach { bank ->
                val destination = state.destinations.firstOrNull { it.bank.equals(bank, true) }
                val selected = state.destination?.bank.equals(bank, true)
                OutlinedButton(onClick = { destination?.let { vm.chooseDestination(it.id.textValue().ifBlank { it.address }) } }, enabled = destination != null,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp), colors = ButtonDefaults.outlinedButtonColors(containerColor = if (selected) UclColors.accent else androidx.compose.ui.graphics.Color.White, contentColor = if (selected) androidx.compose.ui.graphics.Color.White else UclColors.ink)) { Text(bank) }
            }
        }
    }
    Spacer(Modifier.height(20.dp))
    JourneyAction(webCopy("common.continue"), enabled = state.method != null && state.destination != null && !state.hasPending) { vm.go(PaymentPage.Amount) }
}

@Composable
private fun DepositAmountScreen(state: PaymentUiState, vm: PaymentViewModel) {
    Text(webCopy("common.amount"), fontSize = androidx.compose.ui.unit.TextUnit.Unspecified, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
    androidx.compose.material3.OutlinedTextField(state.amount, { vm.field("amount", it) }, Modifier.fillMaxWidth().heightIn(min = 72.dp),
        singleLine = true, shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 32.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold),
        suffix = { Text(state.method?.code.orEmpty().uppercase()) }, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Decimal))
    Surface(color = UclColors.blueSurface, shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(webCopy("mobile.deposit.usdtEquivalent"), Modifier.weight(1f), color = UclColors.muted)
            val amount = state.amount.toDoubleOrNull()
            val rate = state.method?.rates.textValue().toDoubleOrNull()
            Text(if (amount != null && rate != null && rate > 0) webMoney(amount / rate * 5000.0) else "? MMK", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
        }
    }
    JourneyAction(webCopy("common.continue"), busy = state.busy, onClick = vm::quoteDeposit)
}

@Composable
private fun DepositDestinationScreen(state: PaymentUiState, vm: PaymentViewModel) {
    Text(webCopy("mobile.deposit.sendEnteredAmount"), color = UclColors.muted, fontSize = 14.sp)
    Text("${state.amount} ${state.method?.code.orEmpty().uppercase()}", fontSize = 32.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
    HorizontalDivider(color = UclColors.dashboardLine)
    val context = LocalContext.current
    state.destination?.let { destination ->
        listOf(webCopy(if (state.method?.local == true) "forms.accountNumber" else "forms.walletAddress") to destination.address,
            webCopy("forms.accountName") to destination.accountname, webCopy("forms.bank") to destination.bank).filter { !it.second.isNullOrBlank() }.forEach { (label, value) ->
            Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) { Text(label, color = UclColors.muted, fontSize = 13.sp); Text(value.orEmpty(), fontWeight = androidx.compose.ui.text.font.FontWeight.Bold) }
                IconButton(onClick = { context.getSystemService(android.content.ClipboardManager::class.java)?.setPrimaryClip(android.content.ClipData.newPlainText(label, value)) }) { WebIcon("copy", tint = UclColors.accent, description = webCopy("common.copy")) }
            }
            HorizontalDivider(color = UclColors.dashboardLine)
        }
        destination.image?.let { WebRemoteImage(it, Modifier.fillMaxWidth().height(220.dp)) }
    }
    Spacer(Modifier.height(20.dp))
    JourneyAction(webCopy("common.continue"), enabled = state.destination != null, onClick = vm::reviewDestination)
}

@Composable
private fun DepositReceiptScreen(state: PaymentUiState, vm: PaymentViewModel) {
    val context = LocalContext.current
    var cameraUri by remember { mutableStateOf<Uri?>(null) }
    var cameraFile by remember { mutableStateOf<File?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let { vm.selectReceipt(context.contentResolver, it) }
    }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success) cameraUri?.let { vm.selectReceipt(context.contentResolver, it) }
        else cameraFile?.delete()
    }
    listOf(webCopy("mobile.deposit.stepMethod") to state.method?.name.orEmpty().uppercase(),
        webCopy("common.amount") to "${state.amount} ${state.method?.code.orEmpty().uppercase()}",
        webCopy("mobile.deposit.paymentDestination") to state.destination?.address.orEmpty()).forEach { (label, value) ->
        Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(label, Modifier.weight(1f), color = UclColors.muted, fontSize = 13.sp)
            Text(value, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.End)
        }
        HorizontalDivider(color = UclColors.dashboardLine)
    }
    var browse by remember { mutableStateOf(false) }
    Box {
        Column(Modifier.fillMaxWidth().heightIn(min = 104.dp).drawBehind {
            drawRoundRect(UclColors.line, cornerRadius = CornerRadius(12.dp.toPx()), style = Stroke(1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(5.dp.toPx(), 4.dp.toPx()))))
        }.background(UclColors.paper, RoundedCornerShape(12.dp)).clickable(enabled = !state.busy) { browse = true }.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically), horizontalAlignment = Alignment.CenterHorizontally) {
            WebIcon("upload", Modifier.size(24.dp), UclColors.accent)
            Text(webCopy("mobile.deposit.browseReceiptImage"), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
        DropdownMenu(browse, onDismissRequest = { browse = false }) {
            DropdownMenuItem(text = { Text(webCopy("mobile.deposit.browseReceiptImage")) }, onClick = {
                browse = false; picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
            })
            DropdownMenuItem(text = { Text(stringResource(R.string.journey_camera)) }, onClick = {
                browse = false
                val directory = File(context.cacheDir, "receipts").apply { mkdirs() }
                val file = File(directory, "${UUID.randomUUID()}.jpg")
                cameraFile = file
                cameraUri = FileProvider.getUriForFile(context, "${context.packageName}.receipts", file)
                cameraUri?.let(camera::launch)
            })
        }
    }
    if (state.receipt != null) {
        Row(Modifier.fillMaxWidth().background(UclColors.surface, RoundedCornerShape(8.dp)).padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            WebIcon("file_image", Modifier.size(20.dp))
            Column(Modifier.weight(1f)) {
                Text(state.receiptName, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                Text(String.format(java.util.Locale.ROOT, "%.2f MB", state.receipt.size / 1024.0 / 1024.0), color = UclColors.muted, fontSize = 12.sp)
            }
            IconButton(onClick = vm::clearReceipt, enabled = !state.busy && !state.uncertain) { WebIcon("x", Modifier.size(18.dp), description = webCopy("mobile.deposit.removeReceipt")) }
        }
    } else Text(webCopy("mobile.deposit.uploadRequired"), color = UclColors.muted, fontSize = 13.sp)
    JourneyAction(webCopy("mobile.deposit.submit"), enabled = state.receipt != null && !state.uncertain && !state.hasPending,
        busy = state.busy, onClick = vm::submitDeposit)
}

@Composable
private fun BindWalletScreen(state: PaymentUiState, vm: PaymentViewModel) {
    var expanded by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxWidth().background(UclColors.paper, RoundedCornerShape(8.dp)).padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(webCopy("forms.chooseMethod"), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Box {
            OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(4.dp), enabled = !state.busy,
                colors = ButtonDefaults.outlinedButtonColors(containerColor = UclColors.surface, contentColor = UclColors.muted)) {
                Text(state.method?.name?.uppercase() ?: webCopy("forms.chooseMethod"), Modifier.weight(1f), fontSize = 13.sp); WebIcon("chevron_down", Modifier.size(16.dp))
            }
            DropdownMenu(expanded, onDismissRequest = { expanded = false }) {
                state.data?.methods.orEmpty().filter { it.available }.forEach { method ->
                    DropdownMenuItem(text = { Text(method.name.uppercase()) }, onClick = { vm.chooseMethod(method.identity); expanded = false })
                }
            }
        }
    }
    WalletWebField(webCopy(if (state.method?.local == true) "forms.accountNumber" else "forms.walletAddress"), state.wallet, { vm.field("wallet", it) }, !state.busy)
    if (state.method?.local == true) {
        WalletWebField(webCopy("forms.accountName"), state.holder, { vm.field("holder", it) }, !state.busy)
        if (state.method?.code == "idr") {
            val context = LocalContext.current
            val banks = remember { context.assets.open("web-banks/idr.json").bufferedReader().use { reader ->
                val array = org.json.JSONArray(reader.readText()); List(array.length()) { array.getJSONObject(it).getString("name") }
            } }
            var banksExpanded by remember { mutableStateOf(false) }
            Column(Modifier.fillMaxWidth().background(UclColors.paper, RoundedCornerShape(8.dp)).padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(webCopy("forms.bank"), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Box {
                    OutlinedButton(onClick = { banksExpanded = true }, modifier = Modifier.fillMaxWidth(), enabled = !state.busy, shape = RoundedCornerShape(4.dp)) { Text(state.bank, Modifier.weight(1f)); WebIcon("chevron_down", Modifier.size(16.dp)) }
                    DropdownMenu(banksExpanded, onDismissRequest = { banksExpanded = false }) {
                        banks.forEach { name -> DropdownMenuItem(text = { Text(name.uppercase()) }, onClick = { vm.field("bank", name); banksExpanded = false }) }
                    }
                }
            }
        } else WalletWebField(webCopy("forms.bankName"), state.bank, { vm.field("bank", it) }, !state.busy)
    }
    JourneyAction(webCopy("mobile.profile.bindWallet"), busy = state.busy, onClick = vm::bindWallet)
}

@Composable
private fun WithdrawalScreen(state: PaymentUiState, vm: PaymentViewModel) {
    val allowed = state.data?.settings?.withdrawalsEnabled == true && state.data.withdrawalEligibility?.canWithdraw == true
    val requested = state.amount.toDoubleOrNull()?.takeIf { it.isFinite() } ?: 0.0
    val feePercent = (state.data?.settings?.withdrawalFeePercent.textValue().toDoubleOrNull() ?: 7.0).coerceIn(0.0, 100.0)
    val fee = java.math.BigDecimal.valueOf(requested * feePercent / 100.0).setScale(3, java.math.RoundingMode.HALF_UP).toDouble()
    WebPanel(radius = 5, padding = 8) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            listOf(webCopy("common.currentBalance") to webMoney(state.profile?.balance.textValue().toDoubleOrNull() ?: 0.0),
                webCopy("mobile.withdraw.withdrawalFee") to "${webMoney(fee)} ($feePercent%)",
                webCopy("mobile.withdraw.requestedAmount") to webMoney(requested),
                webCopy("mobile.withdraw.youReceive") to webMoney(requested),
                webCopy("mobile.withdraw.totalDeducted") to webMoney(requested + fee)).forEach { (label, value) ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(label, fontSize = 12.sp); Text(value, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }
            }
            val payoutMethod = state.data?.methods?.find { it.name.equals(state.payoutWallet?.walletnames, true) || it.code.equals(state.payoutWallet?.walletnames, true) }
            if (payoutMethod != null && payoutMethod.code != "mmk") {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(webCopy("mobile.withdraw.youReceiveIn", "currency" to payoutMethod.code.uppercase()), fontSize = 12.sp)
                    Text(String.format(java.util.Locale.ROOT, "%.2f %s", requested / 5000.0 * (payoutMethod.rates.textValue().toDoubleOrNull() ?: 1.0), payoutMethod.code.uppercase()), fontSize = 14.sp)
                }
            }
            HorizontalDivider(color = UclColors.dashboardLine)
            TextButton(onClick = { vm.go(PaymentPage.BindWallet) }, modifier = Modifier.fillMaxWidth().background(UclColors.paper, RoundedCornerShape(8.dp))) { WebIcon("link2", tint = UclColors.muted); Spacer(Modifier.width(8.dp)); Text(webCopy("mobile.withdraw.bindWallet"), color = UclColors.ink) }
        }
    }
    Text(webCopy("mobile.withdraw.chooseWallet"), fontSize = 12.sp)
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { expanded = true }, enabled = allowed && !state.busy, modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp), shape = androidx.compose.foundation.shape.RoundedCornerShape(4.dp)) {
            Text(state.payoutWallet?.let { "${it.wallet} ${it.walletnames}" } ?: webCopy("mobile.withdraw.selectWithdrawalMethod"), Modifier.weight(1f)); WebIcon("chevron_down")
        }
        DropdownMenu(expanded, onDismissRequest = { expanded = false }) {
            state.data?.wallets.orEmpty().forEach { wallet -> DropdownMenuItem(text = { Text("${wallet.wallet} ${wallet.walletnames}") }, onClick = { vm.chooseWallet(wallet.id.textValue().ifBlank { wallet.wallet }); expanded = false }) }
        }
    }
    JourneyField(webCopy("mobile.withdraw.amountLabel"), state.amount, { vm.field("amount", it) }, KeyboardType.Decimal, enabled = allowed && !state.busy)
    JourneyField(webCopy("forms.transactionPin"), state.pin, { vm.field("pin", it) }, KeyboardType.NumberPassword, enabled = allowed && !state.busy)
    if (!state.hasPin) TextButton(onClick = { vm.go(PaymentPage.Pin) }) { Text(webCopy("mobile.profile.codeSetting")) }
    JourneyAction(webCopy("mobile.withdraw.submit"), enabled = allowed && !state.hasPending && !state.uncertain,
        busy = state.busy, onClick = vm::submitWithdrawal)
    val eligibility = state.data?.withdrawalEligibility
    if (eligibility?.canWithdraw != true) {
        Text(webCopy(when (eligibility?.code) { "PAYMENT_REQUEST_PENDING" -> "messages.paymentRequestPending"; "WITHDRAWAL_COOLDOWN" -> "messages.withdrawalCooldown"; else -> "messages.withdrawalPending" }), color = Color(0xFF9F2020), fontSize = 14.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }

}

@Composable
private fun WithdrawalReviewScreen(state: PaymentUiState, vm: PaymentViewModel) {
    state.withdrawalQuote?.let { quote ->
        JourneyFact(stringResource(R.string.journey_requested), "${quote.requestedAmount.textValue()} MMK")
        JourneyFact(stringResource(R.string.journey_fee), "${quote.feeAmount.textValue()} MMK")
        JourneyFact(stringResource(R.string.journey_total_deduction), "${quote.totalAmount.textValue()} MMK")
    }
    JourneyFact(stringResource(R.string.journey_wallet_address), state.payoutWallet?.wallet.orEmpty())
    JourneyField(stringResource(R.string.journey_pin), state.pin, { vm.field("pin", it) }, KeyboardType.NumberPassword, secret = true, enabled = !state.busy)
    JourneyAction(stringResource(R.string.journey_submit_withdrawal), enabled = !state.uncertain, busy = state.busy, onClick = vm::submitWithdrawal)
}

@Composable
private fun PinScreen(state: PaymentUiState, vm: PaymentViewModel) {
    Surface(color = UclColors.blueSurface, shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)) {
        Text(webCopy("mobile.pin.warning"), Modifier.fillMaxWidth().padding(16.dp), color = UclColors.accent, fontSize = 15.sp)
    }
    JourneyField(webCopy("forms.enterPin"), state.pin, { vm.field("pin", it) }, KeyboardType.NumberPassword, enabled = !state.busy && !state.hasPin, floatingLabel = webCopy("forms.enterPin"))
    JourneyField(webCopy("forms.confirmPin"), state.confirmPin, { vm.field("confirmPin", it) }, KeyboardType.NumberPassword, secret = true, enabled = !state.busy && !state.hasPin, floatingLabel = webCopy("forms.enterPin"))
    JourneyAction(webCopy(if (state.hasPin) "messages.pinAlreadySet" else "mobile.pin.set"), enabled = !state.hasPin, busy = state.busy, onClick = vm::setPin)
}

@Composable
private fun SubmissionSuccessScreen(withdrawal: Boolean, onDone: () -> Unit) {
    Box(Modifier.size(80.dp), contentAlignment = androidx.compose.ui.Alignment.Center) {
        Surface(shape = androidx.compose.foundation.shape.CircleShape, color = UclColors.accent, modifier = Modifier.fillMaxSize()) {
            Box(contentAlignment = androidx.compose.ui.Alignment.Center) { WebIcon("check", Modifier.size(32.dp), androidx.compose.ui.graphics.Color.White) }
        }
    }
    Spacer(Modifier.height(24.dp))
    Text(webCopy(if (withdrawal) "mobile.withdraw.successTitle" else "mobile.deposit.successTitle"), fontFamily = androidx.compose.ui.text.font.FontFamily.Serif, fontSize = 32.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    Text(webCopy(if (withdrawal) "messages.withdrawalSent" else "messages.depositSubmitted"), Modifier.padding(top = 16.dp, bottom = 24.dp), color = UclColors.muted, fontSize = 16.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    Button(onClick = onDone, shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), modifier = Modifier.heightIn(min = 48.dp)) {
        Text(webCopy(if (withdrawal) "common.done" else "common.continue")); Spacer(Modifier.width(8.dp)); WebIcon("arrow_right", tint = androidx.compose.ui.graphics.Color.White)
    }
}

@Composable
private fun WalletWebField(label: String, value: String, onChange: (String) -> Unit, enabled: Boolean) {
    Column(Modifier.fillMaxWidth().background(UclColors.paper, RoundedCornerShape(8.dp)).padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        OutlinedTextField(value, onChange, Modifier.fillMaxWidth(), enabled = enabled, singleLine = true, placeholder = { Text(label) }, shape = RoundedCornerShape(8.dp))
    }
}
