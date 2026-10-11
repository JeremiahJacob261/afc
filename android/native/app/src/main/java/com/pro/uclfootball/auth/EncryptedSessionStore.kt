package com.pro.uclfootball.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import java.security.GeneralSecurityException
import java.security.KeyStore
import javax.crypto.AEADBadTagException
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

interface SessionStore {
    fun read(): SupabaseSession?
    fun write(session: SupabaseSession)
    fun clear()
}

class EncryptedSessionStore(context: Context) : SessionStore {
    private val preferences = context.applicationContext.getSharedPreferences(
        PREFERENCES_NAME,
        Context.MODE_PRIVATE,
    )
    private val json = Json { ignoreUnknownKeys = true }

    @Synchronized
    override fun read(): SupabaseSession? {
        val iv = preferences.getString(KEY_IV, null)?.decodeBase64() ?: return null
        val ciphertext = preferences.getString(KEY_CIPHERTEXT, null)?.decodeBase64() ?: return null

        return try {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
            val plaintext = cipher.doFinal(ciphertext).toString(Charsets.UTF_8)
            json.decodeFromString<SupabaseSession>(plaintext)
        } catch (_: AEADBadTagException) {
            clear()
            null
        } catch (_: GeneralSecurityException) {
            clear()
            null
        } catch (_: SerializationException) {
            clear()
            null
        }
    }

    @Synchronized
    override fun write(session: SupabaseSession) {
        require(session.accessToken.isNotBlank()) { "An access token is required." }
        require(session.refreshToken.isNotBlank()) { "A refresh token is required." }

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val ciphertext = cipher.doFinal(json.encodeToString(session).toByteArray(Charsets.UTF_8))
        preferences.edit()
            .putString(KEY_IV, cipher.iv.encodeBase64())
            .putString(KEY_CIPHERTEXT, ciphertext.encodeBase64())
            .apply()
    }

    @Synchronized
    override fun clear() {
        preferences.edit().clear().apply()
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE).run {
            init(
                KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setRandomizedEncryptionRequired(true)
                    .build(),
            )
            generateKey()
        }
    }

    private fun String.decodeBase64(): ByteArray? =
        runCatching { Base64.decode(this, Base64.NO_WRAP) }.getOrNull()

    private fun ByteArray.encodeBase64(): String = Base64.encodeToString(this, Base64.NO_WRAP)

    private companion object {
        const val ANDROID_KEY_STORE = "AndroidKeyStore"
        const val KEY_ALIAS = "ucl.native.session.v1"
        const val PREFERENCES_NAME = "ucl_encrypted_session"
        const val KEY_IV = "iv"
        const val KEY_CIPHERTEXT = "ciphertext"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_BITS = 128
    }
}
