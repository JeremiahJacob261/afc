package com.pro.uclfootball.ui

import androidx.compose.material3.ColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import org.junit.Assert.assertTrue
import org.junit.Test

class ThemeContrastTest {
    private fun contrast(foreground: Color, background: Color): Float {
        val a = foreground.luminance()
        val b = background.luminance()
        return (maxOf(a, b) + .05f) / (minOf(a, b) + .05f)
    }

    private fun checkScheme(scheme: ColorScheme) {
        listOf(
            scheme.onPrimary to scheme.primary,
            scheme.onPrimaryContainer to scheme.primaryContainer,
            scheme.onSecondary to scheme.secondary,
            scheme.onSecondaryContainer to scheme.secondaryContainer,
            scheme.onTertiary to scheme.tertiary,
            scheme.onTertiaryContainer to scheme.tertiaryContainer,
            scheme.onBackground to scheme.background,
            scheme.onSurface to scheme.surface,
            scheme.onSurfaceVariant to scheme.surfaceVariant,
            scheme.onError to scheme.error,
            scheme.onErrorContainer to scheme.errorContainer,
            // Selected navigation label sits outside the indicator.
            scheme.secondary to scheme.surface,
            scheme.onSurfaceVariant to scheme.surface,
        ).forEach { (foreground, background) ->
            assertTrue("Text and icons need AA contrast: $foreground on $background", contrast(foreground, background) >= 4.5f)
        }
    }

    @Test fun lightThemePairsAreReadable() = checkScheme(UclColorScheme)
    @Test fun darkThemePairsAreReadable() = checkScheme(UclDarkColorScheme)

    @Test fun secondaryTransactionAmountsStayReadableOnLightCards() {
        assertTrue(contrast(UclColors.muted, Color.White) >= 4.5f)
    }

    @Test fun fixedPanelsChooseReadableForegroundsInEitherSystemTheme() {
        listOf(Color.White, UclColors.paper, UclColors.surface, UclColors.blueSurface,
            UclColors.pinkSurface, UclColors.errorSurface, UclColors.accentDeep).forEach { background ->
            assertTrue(contrast(readableContentColor(background), background) >= 4.5f)
        }
    }
}
