package com.pro.uclfootball.cache

/** Only display identity is cached. Balances, eligibility and rewards always come from the server. */
class CustomerIdentityCache(private val store: IdentityCacheStore) {
    @Synchronized
    fun username(userId: String?): String? {
        if (userId.isNullOrBlank() || store.userId != userId) {
            store.clear()
            return null
        }
        return store.username?.takeIf(String::isNotBlank)
    }

    @Synchronized
    fun update(userId: String?, username: String?) {
        if (userId.isNullOrBlank()) return
        store.write(userId, username?.takeIf(String::isNotBlank))
    }

    @Synchronized
    fun clear() = store.clear()
}

interface IdentityCacheStore {
    val userId: String?
    val username: String?
    fun write(userId: String, username: String?)
    fun clear()
}
