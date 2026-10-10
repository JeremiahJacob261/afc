package com.pro.uclfootball.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

fun JsonElement?.textValue(): String = runCatching { this?.jsonPrimitive?.contentOrNull }.getOrNull().orEmpty()

@Serializable
data class PaymentDataResponse(
    val status: String, val methods: List<PaymentMethodDto> = emptyList(),
    val destinations: List<PaymentDestinationDto> = emptyList(), val wallets: List<PayoutWalletDto> = emptyList(),
    val settings: WithdrawalSettingsDto? = null, val withdrawalEligibility: WithdrawalEligibilityDto? = null,
    val pendingPaymentRequest: PendingPaymentDto? = null,
)
@Serializable data class PaymentMethodDto(
    val id: JsonElement? = null, val name: String = "", @SerialName("currency_code") val currencyCode: String? = null,
    val type: String? = null, val rates: JsonElement? = null, val available: Boolean = true, val notes: String? = null,
) {
    val identity get() = id.textValue().ifBlank { name }
    val code get() = (currencyCode ?: name).lowercase()
    val local get() = type?.lowercase() in listOf("local", "local-transfer", "bank", "mobile-money")
}
@Serializable data class PaymentDestinationDto(
    val id: JsonElement? = null, val name: String = "", @SerialName("currency_code") val currencyCode: String? = null,
    val address: String = "", val bank: String? = null, val accountname: String? = null,
)
@Serializable data class PayoutWalletDto(
    val id: JsonElement? = null, val wallet: String = "", val walletnames: String = "",
    val bank: String? = null, val names: String? = null, val method: String? = null,
)
@Serializable data class WithdrawalSettingsDto(
    val withdrawalsEnabled: Boolean = false, val minWithdrawalAmount: JsonElement? = null,
    val maxWithdrawalAmount: JsonElement? = null, val withdrawalFeePercent: JsonElement? = null,
    val withdrawalDisabledMessage: String? = null,
)
@Serializable data class WithdrawalEligibilityDto(val canWithdraw: Boolean = false, val code: String? = null, val retryAt: String? = null)
@Serializable data class PendingPaymentDto(val type: String? = null)
@Serializable data class DepositQuoteDto(val status: String, val rate: Double, val ledgerAmount: JsonElement, val valid: Boolean)
@Serializable data class WithdrawalQuoteDto(val status: String, val requestedAmount: JsonElement, val feeAmount: JsonElement, val totalAmount: JsonElement)
@Serializable data class JourneyResult(val status: String, val message: String? = null, val code: String? = null, val retryAt: String? = null)
@Serializable data class BindWalletRequest(val methodId: String, val wallet: String, val name: String, val bank: String)
@Serializable data class SetPinRequest(val pin: String)
@Serializable data class WithdrawalRequest(val pass: String, val wallet: String, val amount: String, val method: String, val bank: String, val accountname: String)
@Serializable data class DepositRequest(val amount: String, val method: String, val methodName: String, val address: String, val adminaddress: String, val expectedRate: Double)
@Serializable data class ReceiptUploadRequest(val image: String, val mimeType: String, val uploadId: String)
@Serializable data class ReceiptUploadResponse(val status: String, val url: String, val path: String)
