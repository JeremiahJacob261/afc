package com.pro.uclfootball.payments

import android.content.ContentResolver
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pro.uclfootball.R
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.network.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.io.IOException
import java.util.UUID
import android.util.Base64

enum class PaymentPage { Wallet, Methods, Amount, Destination, Receipt, DepositSuccess, BindWallet, Withdraw, WithdrawalReview, WithdrawalSuccess, Pin }

data class PaymentUiState(
    val page: PaymentPage = PaymentPage.Wallet, val loading: Boolean = true, val busy: Boolean = false,
    val data: PaymentDataResponse? = null, val profile: CustomerProfileDto? = null,
    val methodId: String = "", val destinationId: String = "", val walletId: String = "",
    val amount: String = "", val wallet: String = "", val holder: String = "", val bank: String = "",
    val pin: String = "", val confirmPin: String = "", val reviewed: Boolean = false,
    val quote: DepositQuoteDto? = null, val withdrawalQuote: WithdrawalQuoteDto? = null,
    val receipt: ByteArray? = null, val receiptName: String = "", val receiptMime: String = "", val uploadId: String = "", val receiptUrl: String? = null,
    val error: Int? = null, val uncertain: Boolean = false, val requiresSignIn: Boolean = false,
) {
    val method get() = data?.methods?.find { it.identity == methodId }
    val destinations get() = data?.destinations.orEmpty().filter { destination ->
        destination.name.equals(method?.name, true) || destination.currencyCode?.equals(method?.currencyCode, true) == true
    }.filter { it.address.isNotBlank() }
    val destination get() = destinations.find { it.id.textValue().ifBlank { it.address } == destinationId }
    val payoutWallet get() = data?.wallets?.find { it.id.textValue().ifBlank { it.wallet } == walletId }
    val hasPin get() = profile?.codeset.textValue().lowercase() in listOf("true", "1")
    val hasPending get() = data?.pendingPaymentRequest != null
}

class PaymentViewModel(private val repository: PaymentRepository, private val sessions: AuthSessionRepository,
    initialPage: PaymentPage) : ViewModel() {
    private val mutableState = MutableStateFlow(PaymentUiState(page = initialPage))
    val state = mutableState.asStateFlow()
    init { refresh() }

    fun refresh() = work(background = true) {
        mutableState.update { it.copy(loading = it.data == null) }
        val (data, profile) = coroutineScope {
            val dataRequest = async { repository.load(onCached = { saved ->
                mutableState.update { it.copy(data = saved, loading = false) }
            }) }
            val profileRequest = async { repository.profile(onCached = { saved ->
                mutableState.update { it.copy(profile = saved.profile) }
            }).profile }
            dataRequest.await() to profileRequest.await()
        }
        mutableState.update { refreshPaymentDraft(it, data).copy(profile = profile, loading = false) }
    }

    fun go(page: PaymentPage) {
        if (state.value.busy) return
        mutableState.update { it.copy(page = page, error = null, pin = "", confirmPin = "") }
    }
    fun back(): Boolean {
        val page = when (state.value.page) {
            PaymentPage.Amount -> PaymentPage.Methods
            PaymentPage.Destination -> PaymentPage.Amount
            PaymentPage.Receipt -> PaymentPage.Destination
            PaymentPage.WithdrawalReview -> PaymentPage.Withdraw
            PaymentPage.Wallet, PaymentPage.Methods, PaymentPage.BindWallet, PaymentPage.Withdraw, PaymentPage.Pin, PaymentPage.DepositSuccess, PaymentPage.WithdrawalSuccess -> return false
            else -> return false
        }
        go(page); return true
    }
    fun chooseMethod(id: String) {
        if (state.value.busy) return
        mutableState.update { it.copy(methodId = id, destinationId = "", amount = "", quote = null,
            reviewed = false, receipt = null, receiptUrl = null, error = null) }
        val method = state.value.method
        if (method != null && method.code !in listOf("mmk", "fcfa", "idr")) {
            state.value.destinations.firstOrNull()?.let { chooseDestination(it.id.textValue().ifBlank { it.address }) }
        }
    }
    fun chooseDestination(id: String) { if (!state.value.busy) mutableState.update { it.copy(destinationId = id, reviewed = false, receiptUrl = null) } }
    fun chooseWallet(id: String) { if (!state.value.busy) mutableState.update { it.copy(walletId = id, withdrawalQuote = null) } }
    fun field(name: String, value: String) {
        if (state.value.busy) return
        mutableState.update {
            val next = when (name) {
                "amount" -> it.copy(amount = value, quote = null, withdrawalQuote = null, reviewed = false, receiptUrl = null)
                "wallet" -> it.copy(wallet = value)
                "holder" -> it.copy(holder = value)
                "bank" -> it.copy(bank = value)
                "pin" -> it.copy(pin = value.filter(Char::isDigit).take(4))
                "confirmPin" -> it.copy(confirmPin = value.filter(Char::isDigit).take(4))
                else -> it
            }
            next.copy(error = null)
        }
    }
    fun reviewDestination() {
        if (state.value.destination == null || state.value.quote?.valid != true) return fail(R.string.journey_incomplete)
        mutableState.update { it.copy(reviewed = true, page = PaymentPage.Receipt, error = null) }
    }
    fun quoteDeposit() = work {
        val current = state.value
        val method = current.method ?: return@work fail(R.string.journey_choose_method)
        if (!positive(current.amount)) return@work fail(R.string.journey_valid_amount)
        val quote = repository.depositQuote(method.code, current.amount)
        if (!quote.valid) return@work fail(R.string.journey_deposit_minimum)
        mutableState.update { it.copy(quote = quote, page = PaymentPage.Destination) }
    }
    fun quoteWithdrawal() = work {
        val current = state.value
        if (!positive(current.amount) || current.payoutWallet == null) return@work fail(R.string.journey_incomplete)
        if (current.hasPending || current.data?.withdrawalEligibility?.canWithdraw != true) return@work fail(R.string.journey_payment_pending)
        if (!current.hasPin) return@work fail(R.string.journey_pin_required)
        val quote = repository.withdrawalQuote(current.amount)
        mutableState.update { it.copy(withdrawalQuote = quote, page = PaymentPage.WithdrawalReview) }
    }
    fun clearReceipt() {
        if (!state.value.busy && !state.value.uncertain) mutableState.update { it.copy(receipt = null, receiptName = "", receiptUrl = null) }
    }
    fun selectReceipt(resolver: ContentResolver, uri: Uri) = work {
        val pair = withContext(Dispatchers.IO) {
            val mime = resolver.getType(uri).orEmpty()
            require(mime in listOf("image/jpeg", "image/png", "image/webp"))
            val bytes = resolver.openInputStream(uri)?.use { stream ->
                val buffer = java.io.ByteArrayOutputStream()
                val chunk = ByteArray(16 * 1024)
                while (true) {
                    val count = stream.read(chunk)
                    if (count < 0) break
                    require(buffer.size() + count <= 8 * 1024 * 1024)
                    buffer.write(chunk, 0, count)
                }
                buffer.toByteArray()
            } ?: throw IOException()
            require(bytes.isNotEmpty())
            bytes to mime
        }
        val name = withContext(Dispatchers.IO) {
            resolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else null
            }
        }.orEmpty().ifBlank { "receipt.${pair.second.substringAfter('/')}" }
        mutableState.update { it.copy(receipt = pair.first, receiptName = name, receiptMime = pair.second, uploadId = UUID.randomUUID().toString(), receiptUrl = null) }
    }
    fun submitDeposit() = work(mutation = true) {
        val current = state.value
        if (current.hasPending || current.uncertain) return@work fail(R.string.journey_payment_pending)
        val method = current.method ?: return@work fail(R.string.journey_incomplete)
        val destination = current.destination ?: return@work fail(R.string.journey_incomplete)
        val quote = current.quote ?: return@work fail(R.string.journey_incomplete)
        val bytes = current.receipt ?: return@work fail(R.string.journey_receipt_required)
        if (!current.reviewed) return@work fail(R.string.journey_incomplete)
        // Reuse the same upload ID and URL for a retry; never create a new receipt on an uncertain submission.
        val url = current.receiptUrl ?: repository.upload(ReceiptUploadRequest(Base64.encodeToString(bytes, Base64.NO_WRAP), current.receiptMime, current.uploadId)).url
        mutableState.update { it.copy(receiptUrl = url) }
        val result = repository.deposit(DepositRequest(current.amount, method.code, method.name, url, destination.address, quote.rate))
        if (result.status != "success") return@work fail(R.string.journey_submission_failed)
        mutableState.update { it.copy(page = PaymentPage.DepositSuccess, receipt = null, receiptUrl = null, reviewed = false) }
    }
    fun bindWallet() = work(mutation = true) {
        val current = state.value
        val method = current.method ?: return@work fail(R.string.journey_choose_method)
        if (current.wallet.isBlank() || method.local && (current.holder.isBlank() || current.bank.isBlank())) return@work fail(R.string.journey_incomplete)
        val result = repository.bind(BindWalletRequest(method.identity, current.wallet.trim(), current.holder.trim(), current.bank.trim()))
        if (result.status != "success") return@work fail(R.string.journey_submission_failed)
        val data = repository.load()
        mutableState.update { it.copy(data = data, wallet = "", holder = "", bank = "", page = PaymentPage.BindWallet) }
    }
    fun submitWithdrawal() = work(mutation = true) {
        val current = state.value
        if (current.uncertain || current.hasPending) return@work fail(R.string.journey_payment_pending)
        val wallet = current.payoutWallet ?: return@work fail(R.string.journey_incomplete)
        if (!positive(current.amount) || current.payoutWallet == null) return@work fail(R.string.journey_incomplete)
        if (!current.hasPin || current.pin.length != 4) return@work fail(R.string.journey_pin_required)
        if (current.data?.withdrawalEligibility?.canWithdraw != true) return@work fail(R.string.journey_payment_pending)
        // Obtain the existing server quote within the submit action, as on the website.
        val quote = try { current.withdrawalQuote ?: repository.withdrawalQuote(current.amount) }
        catch (_: IOException) { return@work fail(R.string.journey_offline) }
        mutableState.update { it.copy(withdrawalQuote = quote) }
        val results = repository.withdraw(WithdrawalRequest(current.pin, wallet.wallet, current.amount, wallet.walletnames, wallet.bank.orEmpty(), wallet.names.orEmpty()))
        mutableState.update { it.copy(pin = "") }
        if (results.firstOrNull()?.status != "Success") return@work fail(R.string.journey_submission_failed)
        mutableState.update { it.copy(page = PaymentPage.WithdrawalSuccess, pin = "", withdrawalQuote = null) }
    }
    fun setPin() = work(mutation = true) {
        val current = state.value
        if (current.hasPin) return@work fail(R.string.journey_pin_locked)
        if (current.pin.length != 4 || current.pin != current.confirmPin) return@work fail(R.string.journey_pin_mismatch)
        val result = repository.pin(SetPinRequest(current.pin))
        if (result.status != "success") return@work fail(R.string.journey_submission_failed)
        val profile = repository.profile().profile
        mutableState.update { it.copy(profile = profile, pin = "", confirmPin = "") }
    }
    private fun fail(resource: Int) { mutableState.update { it.copy(error = resource) } }
    private fun positive(value: String) = value.toBigDecimalOrNull()?.signum() == 1
    private var refreshRunning = false
    private fun work(mutation: Boolean = false, background: Boolean = false, block: suspend () -> Unit) {
        if (state.value.busy || background && refreshRunning) return
        if (background) refreshRunning = true
        mutableState.update { it.copy(busy = if (background) it.busy else true, error = null) }
        viewModelScope.launch {
            try { block() }
            catch (error: CancellationException) { throw error }
            catch (error: ApiException) {
                if (error.httpStatus == 401) {
                    mutableState.update { it.copy(requiresSignIn = true) }
                } else fail(if (error.httpStatus == 409) R.string.journey_data_changed else R.string.journey_submission_failed)
            }
            catch (error: IOException) {
                mutableState.update { it.copy(uncertain = it.uncertain || mutation, error = if (mutation) R.string.journey_uncertain else R.string.journey_offline) }
            }
            catch (error: Exception) { fail(R.string.journey_submission_failed) }
            finally {
                if (background) refreshRunning = false
                mutableState.update { it.copy(busy = if (background) it.busy else false, loading = false, pin = if (mutation) "" else it.pin, confirmPin = if (mutation) "" else it.confirmPin) }
            }
        }
    }
}

/** Resume (including photo picker return) retains a draft unless the reviewed payment details changed. */
internal fun refreshPaymentDraft(current: PaymentUiState, data: PaymentDataResponse): PaymentUiState {
    val refreshed = current.copy(data = data, withdrawalQuote = null)
    val reviewed = current.page in listOf(PaymentPage.Destination, PaymentPage.Receipt)
    val oldDestination = current.destination
    val newDestination = refreshed.destination
    val changed = reviewed && (current.quote?.rate != refreshed.method?.rates.textValue().toDoubleOrNull() ||
        oldDestination == null || newDestination == null || oldDestination.address != newDestination.address ||
        oldDestination.bank != newDestination.bank || oldDestination.accountname != newDestination.accountname)
    return if (changed) refreshed.copy(page = PaymentPage.Amount, quote = null, reviewed = false, receiptUrl = null,
        error = R.string.journey_data_changed) else refreshed
}
