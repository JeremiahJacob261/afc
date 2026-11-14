package com.pro.uclfootball.ui

import org.junit.Assert.*
import org.junit.Test

class AccountCurrencyTest {
    @Test fun fixedRatesAndLabelsFollowTheAccountContract() {
        for ((code, expected) in listOf("USDT" to 1.0, "MMK" to 5000.0, "FCFA" to 600.0, "ZMW" to 20.0)) {
            assertTrue(AccountCurrency.read("""{"currency":{"code":"$code","contract":1}}"""))
            assertEquals(expected, AccountCurrency.fromMmk(5000.0), 0.0000001)
            assertEquals(code, AccountCurrency.code)
        }
    }
    @Test fun unversionedResponsesCannotChangeTheCurrency() {
        AccountCurrency.reset()
        assertFalse(AccountCurrency.read("""{"currency":{"code":"MMK"}}"""))
        assertEquals("USDT", AccountCurrency.code)
        assertTrue(AccountCurrency.requiresContract("api/me"))
        assertFalse(AccountCurrency.requiresContract("api/platform-settings"))
    }
    @Test fun fixedStakeInstructionsConvertBeforeInterpolation() {
        AccountCurrency.read("""{"currency":{"code":"USDT","contract":1}}""")
        assertEquals("Minimum stake is 0.5 USDT", AccountCurrency.copy("Minimum stake is 2,500 MMK"))
        assertEquals("Minimum 5 USDT", AccountCurrency.copy("Minimum MMK ၂၅,၀၀၀"))
    }
}
