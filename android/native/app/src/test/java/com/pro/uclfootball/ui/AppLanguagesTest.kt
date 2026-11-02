package com.pro.uclfootball.ui
import org.junit.Assert.*
import org.junit.Test
class AppLanguagesTest {
    @Test fun freshAndInvalidPreferencesUseEnglish() {
        assertEquals("en", AppLanguages.resolve(null))
        assertEquals("en", AppLanguages.resolve("unknown"))
    }
    @Test fun translatedLanguagePreferencesArePreserved() {
        for (code in listOf("en","my","ar","es","fr","it","ru")) assertEquals(code, AppLanguages.resolve(code))
    }
}
