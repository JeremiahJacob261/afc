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
    val receipt: ByteArray? = null, val receiptMime: String = "", val uploadId: String = "", val receiptUrl: String? = null,
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

    fun refresh() = work {
        mutableState.update { it.copy(loading = true, data = null, profile = null, quote = null, withdrawalQuote = null, reviewed = false,
            page = when (it.page) {
                PaymentPage.Destination, PaymentPage.Receipt -> PaymentPage.Amount
                PaymentPage.WithdrawalReview -> PaymentPage.Withdraw
                else -> it.page
            }) }
        val data = repository.load()
        val profile = repository.profile().profile
        mutableState.update { it.copy(data = data, profile = profile, loading = false) }
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
            PaymentPage.Wallet, PaymentPage.DepositSuccess, PaymentPage.WithdrawalSuccess -> return false
            else -> PaymentPage.Wallet
        }
        go(page); return true
    }
    fun chooseMethod(id: String) {
        if (state.value.busy) return
        mutableState.update { it.copy(methodId = id, destinationId = "", amount = "", quote = null,
            reviewed = false, receipt = null, receiptUrl = null, error = null) }
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
        mutableState.update { it.copy(receipt = pair.first, receiptMime = pair.second, uploadId = UUID.randomUUID().toString(), receiptUrl = null) }
    }
    fun submitDeposit() = work(mutation = true) {
        val current = state.value
        if (!NativeJourneyGates.payments) return@work fail(R.string.journey_unavailable)
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
        if (!NativeJourneyGates.payments) return@work fail(R.string.journey_unavailable)
        val current = state.value
        val method = current.method ?: return@work fail(R.string.journey_choose_method)
        if (current.wallet.isBlank() || method.local && (current.holder.isBlank() || current.bank.isBlank())) return@work fail(R.string.journey_incomplete)
        val result = repository.bind(BindWalletRequest(method.identity, current.wallet.trim(), current.holder.trim(), current.bank.trim()))
        if (result.status != "success") return@work fail(R.string.journey_submission_failed)
        val data = repository.load()
        mutableState.update { it.copy(data = data, wallet = "", holder = "", bank = "", page = PaymentPage.Wallet) }
    }
    fun submitWithdrawal() = work(mutation = true) {
        if (!NativeJourneyGates.payments || !NativeJourneyGates.pin) return@work fail(R.string.journey_unavailable)
        val current = state.value
        if (current.uncertain || current.hasPending) return@work fail(R.string.journey_payment_pending)
        val wallet = current.payoutWallet ?: return@work fail(R.string.journey_incomplete)
        if (current.pin.length != 4 || current.withdrawalQuote == null) return@work fail(R.string.journey_pin_required)
        val results = repository.withdraw(WithdrawalRequest(current.pin, wallet.wallet, current.amount, wallet.walletnames, wallet.bank.orEmpty(), wallet.names.orEmpty()))
        mutableState.update { it.copy(pin = "") }
        if (results.firstOrNull()?.status != "Success") return@work fail(R.string.journey_submission_failed)
        mutableState.update { it.copy(page = PaymentPage.WithdrawalSuccess, pin = "", withdrawalQuote = null) }
    }
    fun setPin() = work(mutation = true) {
        if (!NativeJourneyGates.pin) return@work fail(R.string.journey_unavailable)
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
    private fun work(mutation: Boolean = false, block: suspend () -> Unit) {
        if (state.value.busy) return
        mutableState.update { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try { block() }
            catch (error: CancellationException) { throw error }
            catch (error: ApiException) {
                if (error.httpStatus == 401 || error.httpStatus == 404 && error.apiError?.message == "Profile not found") {
                    sessions.clear(); mutableState.update { it.copy(requiresSignIn = true) }
                } else fail(if (error.httpStatus == 409) R.string.journey_data_changed else R.string.journey_submission_failed)
            }
            catch (error: IOException) {
                mutableState.update { it.copy(uncertain = it.uncertain || mutation, error = if (mutation) R.string.journey_uncertain else R.string.journey_offline) }
            }
            catch (error: Exception) { fail(R.string.journey_submission_failed) }
            finally { mutableState.update { it.copy(busy = false, loading = false, pin = if (mutation) "" else it.pin, confirmPin = if (mutation) "" else it.confirmPin) } }
        }
    }
}
