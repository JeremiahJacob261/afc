package com.pro.uclfootball.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object UclColors {
    val ink = Color(0xFF080F32)
    val body = Color(0xFF293E60)
    val accent = Color(0xFF0649FF)
    val paper = Color(0xFFF8FAFF)
    val surface = Color(0xFFEDF2FC)
    val secondary = Color(0xFF315DA8)
    val line = Color(0xFF6E7D99)
    val dashboardLine = Color(0xFFDCE4F2)
    val muted = Color(0xFF536583)
    val darkGround = Color(0xFF07142E)
    val error = Color(0xFF9A1B1B)
    val errorSurface = Color(0xFFFFF2EF)
    val blueSurface = Color(0xFFEAF0FB)
    val blueInk = Color(0xFF31588F)
    val success = Color(0xFF174EAC)
    val successSurface = Color(0xFFE7EFFF)
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

private val UclColorScheme = lightColorScheme(
    primary = UclColors.accent,
    onPrimary = UclColors.paper,
    secondary = UclColors.secondary,
    onSecondary = Color.White,
    background = UclColors.paper,
    onBackground = UclColors.ink,
    surface = UclColors.paper,
    onSurface = UclColors.ink,
    surfaceVariant = UclColors.surface,
    onSurfaceVariant = UclColors.body,
    outline = UclColors.line,
    error = UclColors.error,
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
    MaterialTheme(colorScheme = UclColorScheme, typography = UclTypography, content = content)
}
