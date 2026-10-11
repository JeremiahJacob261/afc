package com.pro.uclfootball.rewards

import com.pro.uclfootball.network.SpinWheelResponse
import com.pro.uclfootball.network.WheelItemDto
import com.pro.uclfootball.network.textValue

data class WheelReward(val amount: Double, val imageUrl: String? = null)

/** Celebrate only the credited server amount, never an estimate from the wheel artwork. */
internal fun confirmedWheelReward(result: SpinWheelResponse, items: List<WheelItemDto>): WheelReward? {
    if (result.status != "success" || result.balance == null) return null
    val amount = result.amount.textValue().toDoubleOrNull()?.takeIf { it.isFinite() && it >= 0 } ?: return null
    return WheelReward(amount, result.prizeIndex?.let(items::getOrNull)?.imageUrl)
}
