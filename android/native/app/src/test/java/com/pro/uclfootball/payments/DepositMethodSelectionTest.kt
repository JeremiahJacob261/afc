package com.pro.uclfootball.payments

import com.pro.uclfootball.network.*
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.*
import org.junit.Test

class DepositMethodSelectionTest {
    private val wave = PaymentMethodDto(id = JsonPrimitive(1), name = "WAVE", currencyCode = "MMK")
    private val kpay = PaymentMethodDto(id = JsonPrimitive(2), name = "Kpay", currencyCode = "MMK")
    private val waveAccount = PaymentDestinationDto(id = JsonPrimitive(3), name = "WAVE", currencyCode = "MMK", address = "wave-account", bank = "Wave")
    private val kpayAccount = PaymentDestinationDto(id = JsonPrimitive(4), name = "Kpay", currencyCode = "MMK", address = "kpay-account", bank = "kpay")
    private val data = PaymentDataResponse("success", methods = listOf(wave, kpay), destinations = listOf(kpayAccount, waveAccount))

    @Test fun waveDoesNotOfferKpayAccountsJustBecauseBothUseMmk() {
        val state = PaymentUiState(data = data, methodId = wave.identity)
        assertEquals(listOf(waveAccount), state.destinations)
    }

    @Test fun kpayDoesNotOfferWaveAccountsJustBecauseBothUseMmk() {
        val state = PaymentUiState(data = data, methodId = kpay.identity)
        assertEquals(listOf(kpayAccount), state.destinations)
    }

    @Test fun selectingAProviderAutomaticallySelectsItsAccountWithoutAnotherChoice() {
        for ((method, account) in listOf(wave to waveAccount, kpay to kpayAccount)) {
            val selected = selectDepositMethod(PaymentUiState(data = data), method.identity)
            assertFalse(selected.requiresTransferOption)
            assertEquals(account, selected.destination)
        }
    }

    @Test fun providerBankLabelsResolveLegacyCurrencyNamedAccounts() {
        val legacy = data.copy(destinations = listOf(kpayAccount.copy(name = "MMK"), waveAccount.copy(name = "MMK")))
        val selected = selectDepositMethod(PaymentUiState(data = legacy), wave.identity)
        assertFalse(selected.requiresTransferOption)
        assertEquals("wave-account", selected.destination?.address)
        assertEquals(1, selected.destinations.size)
    }

    @Test fun switchingProvidersClearsReviewedPaymentAndReceipt() {
        val draft = PaymentUiState(data = data, methodId = kpay.identity, destinationId = "4", amount = "25000",
            reviewed = true, quote = DepositQuoteDto("success", 5000.0, JsonPrimitive(25000), true),
            receipt = byteArrayOf(1), receiptUrl = "receipt-url")
        val selected = selectDepositMethod(draft, wave.identity)
        assertEquals(waveAccount, selected.destination)
        assertEquals("", selected.amount)
        assertFalse(selected.reviewed)
        assertNull(selected.quote)
        assertNull(selected.receipt)
        assertNull(selected.receiptUrl)
    }

    @Test fun missingProviderAccountDoesNotOfferAnotherProvider() {
        val selected = selectDepositMethod(PaymentUiState(data = data.copy(destinations = listOf(kpayAccount))), wave.identity)
        assertFalse(selected.requiresTransferOption)
        assertTrue(selected.destinations.isEmpty())
        assertNull(selected.destination)
    }

    @Test fun legacyCurrencyOnlyMethodsStillRequireAnExplicitBankChoice() {
        val generic = wave.copy(name = "MMK")
        val legacy = data.copy(methods = listOf(generic), destinations = listOf(kpayAccount.copy(name = ""), waveAccount.copy(name = "")))
        val selected = selectDepositMethod(PaymentUiState(data = legacy), generic.identity)
        assertTrue(selected.requiresTransferOption)
        assertNull(selected.destination)
        assertEquals(2, selected.destinations.size)
    }

    @Test fun namedUsdtNetworksKeepTheirOwnDestination() {
        val trc20 = wave.copy(name = "USDT (TRC20)", currencyCode = "USDT")
        val bep20 = kpay.copy(name = "USDT (BEP20)", currencyCode = "USDT")
        val trcAccount = waveAccount.copy(name = trc20.name, currencyCode = "USDT")
        val bepAccount = kpayAccount.copy(name = bep20.name, currencyCode = "USDT")
        val crypto = data.copy(methods = listOf(trc20, bep20), destinations = listOf(bepAccount, trcAccount))
        val selected = selectDepositMethod(PaymentUiState(data = crypto), trc20.identity)
        assertFalse(selected.requiresTransferOption)
        assertEquals(trcAccount, selected.destination)
    }
}
