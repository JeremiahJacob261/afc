package com.pro.uclfootball.rewards

import com.pro.uclfootball.network.SpinWheelResponse
import com.pro.uclfootball.network.WheelItemDto
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.*
import org.junit.Test

class WheelRewardTest {
    private val items = listOf(WheelItemDto(amount = JsonPrimitive(99999), imageUrl = "/prize.png"))

    @Test fun celebrationUsesCreditedAmountRatherThanArtworkEstimate() {
        val result = SpinWheelResponse(status = "success", prizeIndex = 0, amount = JsonPrimitive("2500"), balance = JsonPrimitive(15000))
        assertEquals(WheelReward(2500.0, "/prize.png"), confirmedWheelReward(result, items))
    }

    @Test fun missingOrFailedCreditDoesNotCelebrate() {
        assertNull(confirmedWheelReward(SpinWheelResponse(status = "error", amount = JsonPrimitive(1000)), items))
        assertNull(confirmedWheelReward(SpinWheelResponse(status = "success", amount = JsonPrimitive(1000)), items))
        assertNull(confirmedWheelReward(SpinWheelResponse(status = "success", balance = JsonPrimitive(1000)), items))
    }

    @Test fun invalidRewardAmountsAreNeverPresented() {
        for (amount in listOf("NaN", "Infinity", "-1", "bad")) {
            assertNull(confirmedWheelReward(SpinWheelResponse(status = "success", amount = JsonPrimitive(amount), balance = JsonPrimitive(1000)), items))
        }
    }

    @Test fun zeroRewardCanStillConfirmACompletedSpinWithoutInventingPrize() {
        val result = SpinWheelResponse(status = "success", prizeIndex = 0, amount = JsonPrimitive(0), balance = JsonPrimitive(1000))
        assertEquals(0.0, confirmedWheelReward(result, items)!!.amount, 0.0)
    }
}
