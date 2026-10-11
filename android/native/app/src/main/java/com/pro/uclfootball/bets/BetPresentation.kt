package com.pro.uclfootball.bets

import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.matchStartMillis

internal fun betOutcome(bet: PlacedBetDto): String? = bet.settlementOutcome ?: when (bet.won) { "true" -> "won"; "false" -> "lost"; else -> null }
internal fun betState(bet: PlacedBetDto, now: Long = System.currentTimeMillis()): String = betOutcome(bet) ?: if ((matchStartMillis(bet.tsgmt, bet.matchDate ?: bet.date, bet.matchTime ?: bet.time) ?: 0) > now) "notStarted" else "ongoing"
internal fun betPotentialReturn(bet: PlacedBetDto): Double {
    val stake = bet.stake.textValue().toDoubleOrNull() ?: 0.0
    return if (betOutcome(bet) == "refunded") stake else bet.aim.textValue().toDoubleOrNull()?.takeIf { it != 0.0 } ?: stake + (bet.profit.textValue().toDoubleOrNull() ?: 0.0)
}
