package com.pro.uclfootball.payments

import com.pro.uclfootball.network.*
import java.net.URLEncoder

class PaymentRepository(private val api: NativeApiClient) {
    suspend fun load() = api.getJson<PaymentDataResponse>("api/mobile/payment-data", authenticated = true)
    suspend fun profile() = api.getJson<MeResponse>("api/me", authenticated = true)
    suspend fun depositQuote(method: String, amount: String) = api.getJson<DepositQuoteDto>(
        "api/mobile/deposit-quote?method=${encode(method)}&amount=${encode(amount)}", authenticated = true)
    suspend fun withdrawalQuote(amount: String) = api.getJson<WithdrawalQuoteDto>(
        "api/mobile/withdrawal-quote?amount=${encode(amount)}", authenticated = true)
    suspend fun bind(request: BindWalletRequest) = api.postJson<BindWalletRequest, JourneyResult>("api/bindwallet", request, true)
    suspend fun pin(request: SetPinRequest) = api.postJson<SetPinRequest, JourneyResult>("api/set-pin", request, true)
    suspend fun withdraw(request: WithdrawalRequest) = api.postJson<WithdrawalRequest, List<JourneyResult>>("api/withdraw", request, true)
    suspend fun deposit(request: DepositRequest) = api.postJson<DepositRequest, JourneyResult>("api/create-deposit", request, true)
    suspend fun upload(request: ReceiptUploadRequest) = api.postJson<ReceiptUploadRequest, ReceiptUploadResponse>("api/mobile/upload-receipt", request, true)
    private fun encode(value: String) = URLEncoder.encode(value, "UTF-8")
}
