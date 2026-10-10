package com.pro.uclfootball.network

/** Source can be completed before deployed contracts are approved. Enable each after integration review. */
object NativeJourneyGates {
    const val registration = false // Identity-bound profile provisioning and confirmation recovery.
    const val payments = false // Approved rails, receipt visibility, payout identity and atomic retry rules.
    const val pin = false // Replace plaintext storage and add server throttling before enabling.
    const val betting = false // Authoritative VIP quote and idempotency ordering must agree with placement.
}
