package com.pro.uclfootball.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object UclColors {
    val ink = Color(0xFF080F32)
    val body = Color(0xFF293E60)
    val accent = Color(0xFF00409E)
    val accentDeep = Color(0xFF002D72)
    val pink = Color(0xFFE6007E)
    val pinkInk = Color(0xFFA90059)
    val pinkSurface = Color(0xFFFFF0F7)
    val focus = Color(0xFF00409E)
    val paper = Color(0xFFF8FAFF)
    val surface = Color(0xFFF1F4FB)
    val secondary = pinkInk
    val line = Color(0xFF667895)
    val dashboardLine = Color(0xFFDCE4F2)
    val muted = Color(0xFF536583)
    val darkGround = Color(0xFF000A1E)
    val error = Color(0xFF9A1B1B)
    val errorSurface = Color(0xFFFFF2EF)
    val blueSurface = Color(0xFFEAF0FB)
    val blueInk = Color(0xFF31588F)
    val success = Color(0xFF216E42)
    val successSurface = Color(0xFFE8F5EC)
}

object UclSpacing {
    val xsmall = 4.dp
    val small = 8.dp
    val medium = 16.dp
    val large = 24.dp
    val xlarge = 32.dp
    val minimumTouchTarget = 48.dp
    val cardRadius = 16.dp
}

internal val UclColorScheme = lightColorScheme(
    primary = UclColors.accent,
    onPrimary = UclColors.paper,
    primaryContainer = UclColors.blueSurface,
    onPrimaryContainer = UclColors.accentDeep,
    secondary = UclColors.secondary,
    onSecondary = Color.White,
    secondaryContainer = UclColors.pinkSurface,
    onSecondaryContainer = UclColors.pinkInk,
    tertiary = UclColors.blueInk,
    onTertiary = Color.White,
    tertiaryContainer = UclColors.blueSurface,
    onTertiaryContainer = UclColors.accentDeep,
    background = UclColors.paper,
    onBackground = UclColors.ink,
    surface = UclColors.paper,
    onSurface = UclColors.ink,
    surfaceVariant = UclColors.surface,
    onSurfaceVariant = UclColors.body,
    outline = UclColors.line,
    outlineVariant = UclColors.dashboardLine,
    error = UclColors.error,
    onError = Color.White,
    errorContainer = UclColors.errorSurface,
    onErrorContainer = UclColors.error,
)

internal val UclDarkColorScheme = darkColorScheme(
    primary = Color(0xFF8DB8FF),
    onPrimary = Color(0xFF002D72),
    primaryContainer = Color(0xFF10284D),
    onPrimaryContainer = Color(0xFFD4E4FF),
    secondary = Color(0xFFFF8AC4),
    onSecondary = Color(0xFF4B002B),
    secondaryContainer = Color(0xFF4B002B),
    onSecondaryContainer = Color(0xFFFFCDE5),
    tertiary = Color(0xFF7CEBFF),
    onTertiary = Color(0xFF003641),
    tertiaryContainer = Color(0xFF004D5B),
    onTertiaryContainer = Color(0xFFA9EDFF),
    background = Color(0xFF000A1E),
    onBackground = Color(0xFFF2F5FA),
    surface = Color(0xFF091B34),
    onSurface = Color(0xFFF2F5FA),
    surfaceVariant = Color(0xFF10284D),
    onSurfaceVariant = Color(0xFFD4DEEF),
    outline = Color(0xFF8293B0),
    outlineVariant = Color(0xFF475E7D),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
)

private val UclTypography = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal, fontSize = 40.sp, lineHeight = 44.sp),
    headlineLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal, fontSize = 32.sp, lineHeight = 36.sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal, fontSize = 28.sp, lineHeight = 32.sp),
    titleLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Normal, fontSize = 24.sp, lineHeight = 29.sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 18.sp, lineHeight = 24.sp),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 21.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 16.sp, lineHeight = 24.sp),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, lineHeight = 16.sp),
)

@Composable
fun UclTheme(content: @Composable () -> Unit) {
    val colorScheme = if (androidx.compose.foundation.isSystemInDarkTheme()) UclDarkColorScheme else UclColorScheme
    MaterialTheme(colorScheme = colorScheme, typography = UclTypography, content = content)
}

/** Pick the strongest foreground for an opaque, explicitly colored panel. */
internal fun readableContentColor(background: Color): Color {
    val lightContrast = 1.05f / (background.luminance() + .05f)
    val darkContrast = (background.luminance() + .05f) / (UclColors.ink.luminance() + .05f)
    return if (darkContrast >= lightContrast) UclColors.ink else Color.White
}
