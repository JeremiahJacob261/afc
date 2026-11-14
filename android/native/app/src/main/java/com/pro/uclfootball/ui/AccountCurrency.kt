package com.pro.uclfootball.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.serialization.json.*

object AccountCurrency {
    var code by mutableStateOf("USDT")
        private set
    val unitsPerUsdt: Double get() = when(code) { "MMK" -> 5000.0; "FCFA" -> 600.0; "ZMW" -> 20.0; else -> 1.0 }
    fun fromMmk(amount: Double): Double = amount / 5000.0 * unitsPerUsdt
    fun reset() { code = "USDT" }
    private fun convertedText(raw: String): String {
        val numeric = raw.filter { it != ',' }.map { if (it.isDigit()) Character.digit(it, 10).digitToChar() else it }.joinToString("").toDouble()
        return "${java.text.NumberFormat.getNumberInstance(java.util.Locale.ROOT).apply { maximumFractionDigits = 6 }.format(fromMmk(numeric))} $code"
    }
    fun copy(text: String): String {
        val number = "(-?[\\p{Nd}][\\p{Nd},]*(?:\\.[\\p{Nd}]+)?)"
        val suffix = Regex("$number\\s+MMK\\b").replace(text) { convertedText(it.groupValues[1]) }
        return Regex("\\bMMK\\s+$number").replace(suffix) { convertedText(it.groupValues[1]) }.replace("MMK", code)
    }
    fun requiresContract(path: String): Boolean = path.trimStart('/').substringBefore('?') in setOf(
        "api/me", "api/my-bets", "api/my-bet", "api/my-referrals", "api/my-transactions", "api/notify",
        "api/place-bet", "api/withdraw", "api/withdrawal-data", "api/wheel-spin", "api/mobile/payment-data",
        "api/mobile/bet-quote", "api/mobile/withdrawal-quote", "api/mobile/deposit-quote")
    fun read(payload: String): Boolean = runCatching {
        val document = Json.parseToJsonElement(payload)
        val root = if (document is JsonArray) document.firstOrNull()?.jsonObject else document.jsonObject
        val currency = root?.get("currency")?.jsonObject ?: return false
        val candidate = currency["code"]?.jsonPrimitive?.content
        if (currency["contract"]?.jsonPrimitive?.intOrNull != 1 || candidate !in setOf("USDT", "MMK", "FCFA", "ZMW")) return false
        code = candidate!!
        true
    }.getOrDefault(false)
}
