package com.pro.uclfootball.payments

import com.pro.uclfootball.network.*
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.*
import org.junit.Test

class PaymentDraftRefreshTest {
    private val method = PaymentMethodDto(id = JsonPrimitive(1), name = "MMK", currencyCode = "mmk", rates = JsonPrimitive(5000))
    private val destination = PaymentDestinationDto(id = JsonPrimitive(2), name = "MMK", address = "123", bank = "Wave", accountname = "Receiver")
    private val data = PaymentDataResponse("success", methods = listOf(method), destinations = listOf(destination))
    private fun receiptDraft() = PaymentUiState(page = PaymentPage.Receipt, data = data, methodId = "1", destinationId = "2",
        amount = "25000", reviewed = true, quote = DepositQuoteDto("success", 5000.0, JsonPrimitive(25000), true),
        receipt = byteArrayOf(1, 2), receiptName = "proof.png", receiptUrl = "https://example.com/proof.png")

    @Test fun photoPickerResumeKeepsReviewedStepAndReceipt() {
        val draft = receiptDraft()
        val resumed = refreshPaymentDraft(draft, data)
        assertEquals(PaymentPage.Receipt, resumed.page)
        assertTrue(resumed.reviewed)
        assertArrayEquals(draft.receipt, resumed.receipt)
        assertEquals(draft.receiptUrl, resumed.receiptUrl)
    }
    @Test fun rateChangeRequiresAmountAndPaymentReviewAgain() {
        val changed = refreshPaymentDraft(receiptDraft(), data.copy(methods = listOf(method.copy(rates = JsonPrimitive(5500)))))
        assertEquals(PaymentPage.Amount, changed.page)
        assertFalse(changed.reviewed)
        assertNull(changed.quote)
        assertNull(changed.receiptUrl)
        assertNotNull(changed.error)
    }
    @Test fun changedOrRemovedDestinationRequiresReviewAgain() {
        for (destinations in listOf(emptyList(), listOf(destination.copy(address = "456")), listOf(destination.copy(bank = "KPay")))) {
            val changed = refreshPaymentDraft(receiptDraft(), data.copy(destinations = destinations))
            assertEquals(PaymentPage.Amount, changed.page)
            assertFalse(changed.reviewed)
        }
    }
    @Test fun sameRateDifferentJsonRepresentationDoesNotInvalidateReceipt() {
        val resumed = refreshPaymentDraft(receiptDraft(), data.copy(methods = listOf(method.copy(rates = JsonPrimitive("5000.00")))))
        assertEquals(PaymentPage.Receipt, resumed.page)
        assertTrue(resumed.reviewed)
    }
}
