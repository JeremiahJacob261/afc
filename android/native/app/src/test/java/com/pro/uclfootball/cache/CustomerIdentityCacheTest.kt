package com.pro.uclfootball.cache

import org.junit.Assert.*
import org.junit.Test

class CustomerIdentityCacheTest {
    private class Store : IdentityCacheStore {
        override var userId: String? = null
        override var username: String? = null
        override fun write(userId: String, username: String?) { this.userId = userId; this.username = username }
        override fun clear() { userId = null; username = null }
    }

    @Test fun restoresAndUpdatesUsernameForSameAccount() {
        val store = Store()
        CustomerIdentityCache(store).update("account-a", "Alice")
        val restored = CustomerIdentityCache(store)
        assertEquals("Alice", restored.username("account-a"))
        restored.update("account-a", "Alice Updated")
        assertEquals("Alice Updated", restored.username("account-a"))
    }

    @Test fun switchingAccountNeverReturnsPreviousName() {
        val cache = CustomerIdentityCache(Store())
        cache.update("account-a", "Alice")
        assertNull(cache.username("account-b"))
        assertNull(cache.username("account-a"))
    }

    @Test fun logoutAndMissingSessionRemoveCachedIdentity() {
        val cache = CustomerIdentityCache(Store())
        cache.update("account-a", "Alice")
        cache.clear()
        assertNull(cache.username("account-a"))
        cache.update("account-a", "Alice")
        assertNull(cache.username(null))
        assertNull(cache.username("account-a"))
    }

    @Test fun blankUsernameRemovesOldDisplayName() {
        val cache = CustomerIdentityCache(Store())
        cache.update("account-a", "Alice")
        cache.update("account-a", " ")
        assertNull(cache.username("account-a"))
    }
}
