package com.pro.uclfootball.ui

import com.pro.uclfootball.network.textValue
import kotlinx.serialization.json.JsonElement
import java.text.SimpleDateFormat
import java.util.Locale

fun matchStartMillis(epoch: JsonElement?, date: String?, time: String?): Long? {
    epoch.textValue().toDoubleOrNull()?.takeIf { it.isFinite() && it > 0 }?.let { return (if (it < 1_000_000_000_000) it * 1000 else it).toLong() }
    if (date?.contains('T') == true) parseWebInstant(date)?.let { return it }
    val source = listOfNotNull(date, time).joinToString(" ").trim()
    return listOf("yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm", "yyyy-MM-dd'T'HH:mm:ssXXX").firstNotNullOfOrNull { format ->
        runCatching { SimpleDateFormat(format, Locale.ROOT).apply { isLenient = false }.parse(source)?.time }.getOrNull()
    }
}
