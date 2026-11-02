package com.pro.uclfootball.ui

object AppLanguages {
    val options = listOf("en" to "English", "my" to "မြန်မာ", "ar" to "العربية", "es" to "Español", "fr" to "Français", "it" to "Italiano", "ru" to "Русский")
    fun resolve(code: String?): String = code?.takeIf { selected -> options.any { it.first == selected } } ?: "en"
}
