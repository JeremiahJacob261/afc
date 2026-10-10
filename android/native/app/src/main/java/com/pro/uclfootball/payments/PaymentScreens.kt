package com.pro.uclfootball.payments

import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
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
    onBack: () -> Unit, onHistory: () -> Unit, onSignInRequired: () -> Unit) {
    val vm: PaymentViewModel = viewModel(factory = remember(container, initialPage) {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T =
                PaymentViewModel(PaymentRepository(container.apiClient), container.authSessionRepository, initialPage) as T
        }
    })
    val state by vm.state.collectAsStateWithLifecycle()
    RefreshOnResume(vm::refresh)
    LaunchedEffect(state.requiresSignIn) { if (state.requiresSignIn) onSignInRequired() }
    val back = { if (!vm.back()) onBack() }
    BackHandler { back() }
    JourneyPage(stringResource(title(state.page)), back) {
        JourneyFeedback(state.error)
        if (state.error == R.string.journey_data_changed) TextButton(onClick = vm::refresh) { Text(stringResource(R.string.common_refresh)) }
        if (state.loading) { CircularProgressIndicator(); return@JourneyPage }
        if (state.data == null) {
            JourneyAction(stringResource(R.string.common_retry), busy = state.busy, onClick = vm::refresh)
            return@JourneyPage
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
            PaymentPage.DepositSuccess -> SubmissionSuccessScreen(false, onHistory, onBack)
            PaymentPage.BindWallet -> BindWalletScreen(state, vm)
            PaymentPage.Withdraw -> WithdrawalScreen(state, vm)
            PaymentPage.WithdrawalReview -> WithdrawalReviewScreen(state, vm)
            PaymentPage.WithdrawalSuccess -> SubmissionSuccessScreen(true, onHistory, onBack)
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
        JourneyChoice(method.name, state.methodId == method.identity, !state.busy) { vm.chooseMethod(method.identity) }
    }
}

@Composable
private fun DepositMethodScreen(state: PaymentUiState, vm: PaymentViewModel) {
    MethodChoices(state, vm)
    state.method?.notes?.takeIf(String::isNotBlank)?.let { Text(it) }
    JourneyAction(stringResource(R.string.journey_continue), enabled = state.method != null && !state.hasPending) { vm.go(PaymentPage.Amount) }
}

@Composable
private fun DepositAmountScreen(state: PaymentUiState, vm: PaymentViewModel) {
    JourneyFact(stringResource(R.string.journey_deposit_method), state.method?.name.orEmpty())
    JourneyField(stringResource(R.string.journey_amount_in, state.method?.currencyCode ?: state.method?.name.orEmpty()), state.amount,
        { vm.field("amount", it) }, KeyboardType.Decimal, enabled = !state.busy)
    Text(stringResource(R.string.journey_server_quote))
    JourneyAction(stringResource(R.string.journey_continue), busy = state.busy, onClick = vm::quoteDeposit)
}

@Composable
private fun DepositDestinationScreen(state: PaymentUiState, vm: PaymentViewModel) {
    state.quote?.let { JourneyFact(stringResource(R.string.journey_ledger_amount), "${it.ledgerAmount.textValue()} MMK") }
    JourneyFact(stringResource(R.string.journey_payment_amount), "${state.amount} ${state.method?.currencyCode ?: state.method?.name.orEmpty()}")
    if (state.destinations.isEmpty()) Text(stringResource(R.string.journey_no_destinations))
    state.destinations.forEach { destination ->
        val id = destination.id.textValue().ifBlank { destination.address }
        JourneyChoice(listOfNotNull(destination.bank, destination.accountname, destination.address).joinToString(" · "), state.destinationId == id) {
            vm.chooseDestination(id)
        }
    }
    val context = LocalContext.current
    state.destination?.let { destination ->
        TextButton(onClick = {
            val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("Payment destination", destination.address))
        }) { Text(stringResource(R.string.journey_copy_destination)) }
    }
    Text(stringResource(R.string.journey_transfer_hint))
    JourneyAction(stringResource(R.string.journey_confirm_transfer), enabled = state.destination != null, onClick = vm::reviewDestination)
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
    Text(stringResource(R.string.journey_receipt_hint))
    TextButton(onClick = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }, enabled = !state.busy) {
        Text(stringResource(R.string.journey_pick_receipt))
    }
    TextButton(onClick = {
        val directory = File(context.cacheDir, "receipts").apply { mkdirs() }
        val file = File(directory, "${UUID.randomUUID()}.jpg")
        cameraFile = file
        cameraUri = FileProvider.getUriForFile(context, "${context.packageName}.receipts", file)
        cameraUri?.let(camera::launch)
    }, enabled = !state.busy) { Text(stringResource(R.string.journey_camera)) }
    val preview by produceState<android.graphics.Bitmap?>(null, state.receipt) {
        value = withContext(Dispatchers.IO) {
            state.receipt?.let { bytes ->
                val bounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
                android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
                val options = android.graphics.BitmapFactory.Options().apply {
                    inSampleSize = 1
                    while (bounds.outWidth / inSampleSize > 1024 || bounds.outHeight / inSampleSize > 1024) inSampleSize *= 2
                }
                android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
            }
        }
    }
    preview?.let { Image(it.asImageBitmap(), stringResource(R.string.journey_receipt), Modifier.fillMaxWidth().height(220.dp)) }
    JourneyAction(stringResource(R.string.journey_submit_deposit), enabled = state.receipt != null && !state.uncertain && !state.hasPending,
        busy = state.busy, onClick = vm::submitDeposit)
}

@Composable
private fun BindWalletScreen(state: PaymentUiState, vm: PaymentViewModel) {
    MethodChoices(state, vm)
    JourneyField(stringResource(R.string.journey_wallet_address), state.wallet, { vm.field("wallet", it) }, enabled = !state.busy)
    if (state.method?.local == true) {
        JourneyField(stringResource(R.string.journey_account_holder), state.holder, { vm.field("holder", it) }, enabled = !state.busy)
        JourneyField(stringResource(R.string.journey_bank), state.bank, { vm.field("bank", it) }, enabled = !state.busy)
    }
    JourneyAction(stringResource(R.string.journey_bind_wallet), busy = state.busy, onClick = vm::bindWallet)
}

@Composable
private fun WithdrawalScreen(state: PaymentUiState, vm: PaymentViewModel) {
    JourneyFact(stringResource(R.string.account_balance), "${state.profile?.balance.textValue()} MMK")
    state.data?.settings?.let {
        JourneyFact(stringResource(R.string.journey_minimum), "${it.minWithdrawalAmount.textValue()} MMK")
        JourneyFact(stringResource(R.string.journey_maximum), "${it.maxWithdrawalAmount.textValue()} MMK")
    }
    if (!state.hasPin) TextButton(onClick = { vm.go(PaymentPage.Pin) }) { Text(stringResource(R.string.journey_pin_required)) }
    if (state.data?.wallets.isNullOrEmpty()) Text(stringResource(R.string.journey_no_wallets))
    state.data?.wallets.orEmpty().forEach { wallet ->
        val id = wallet.id.textValue().ifBlank { wallet.wallet }
        JourneyChoice("${wallet.walletnames} · ${wallet.wallet}", state.walletId == id, !state.busy) { vm.chooseWallet(id) }
    }
    TextButton(onClick = { vm.go(PaymentPage.BindWallet) }) { Text(stringResource(R.string.journey_bind_wallet)) }
    JourneyField(stringResource(R.string.journey_amount_mmk), state.amount, { vm.field("amount", it) }, KeyboardType.Decimal, enabled = !state.busy)
    state.data?.withdrawalEligibility?.retryAt?.let { JourneyFact(stringResource(R.string.journey_retry_at), it) }
    JourneyAction(stringResource(R.string.journey_review_withdrawal),
        enabled = state.data?.settings?.withdrawalsEnabled == true && !state.hasPending && !state.uncertain,
        busy = state.busy, onClick = vm::quoteWithdrawal)
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
    if (state.hasPin) { Text(stringResource(R.string.journey_pin_locked)); return }
    JourneyField(stringResource(R.string.journey_pin), state.pin, { vm.field("pin", it) }, KeyboardType.NumberPassword, secret = true, enabled = !state.busy)
    JourneyField(stringResource(R.string.journey_confirm_pin), state.confirmPin, { vm.field("confirmPin", it) }, KeyboardType.NumberPassword, secret = true, enabled = !state.busy)
    JourneyAction(stringResource(R.string.journey_save_pin), busy = state.busy, onClick = vm::setPin)
}

@Composable
private fun SubmissionSuccessScreen(withdrawal: Boolean, onHistory: () -> Unit, onDone: () -> Unit) {
    Text(stringResource(if (withdrawal) R.string.journey_withdraw_submitted else R.string.journey_deposit_submitted))
    JourneyAction(stringResource(R.string.transactions_title), onClick = onHistory)
    TextButton(onClick = onDone) { Text(stringResource(R.string.journey_done)) }
}
