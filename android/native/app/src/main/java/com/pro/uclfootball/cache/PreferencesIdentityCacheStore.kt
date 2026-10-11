package com.pro.uclfootball.cache

import android.content.Context

class PreferencesIdentityCacheStore(context: Context) : IdentityCacheStore {
    private val preferences = context.applicationContext.getSharedPreferences("customer_identity", Context.MODE_PRIVATE)
    override val userId: String? get() = preferences.getString("user_id", null)
    override val username: String? get() = preferences.getString("username", null)
    override fun write(userId: String, username: String?) {
        preferences.edit().putString("user_id", userId).putString("username", username).apply()
    }
    override fun clear() { preferences.edit().clear().apply() }
}
