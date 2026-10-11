package com.pro.uclfootball.cache

import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class TestSnapshotCipher : SnapshotCipher {
    private val key = KeyGenerator.getInstance("AES").apply { init(128) }.generateKey()
    override fun encrypt(plaintext: ByteArray) = Cipher.getInstance("AES/GCM/NoPadding").run {
        init(Cipher.ENCRYPT_MODE, key); iv + doFinal(plaintext)
    }
    override fun decrypt(ciphertext: ByteArray) = Cipher.getInstance("AES/GCM/NoPadding").run {
        init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, ciphertext.copyOfRange(0, 12)))
        doFinal(ciphertext.copyOfRange(12, ciphertext.size))
    }
}

class CustomerSnapshotStoreTest {
    @get:Rule val temporary = TemporaryFolder()

    @Test fun encryptedSnapshotsSurviveRestartAndRetainTimestamp() {
        val directory = temporary.newFolder(); val cipher = TestSnapshotCipher()
        val store = CustomerSnapshotStore(directory, cipher, now = { 1234 })
        store.selectAccount("alice")
        store.write("alice", "api/me", "private-username", store.generation())
        assertFalse(directory.listFiles()!!.any { it.readBytes().decodeToString().contains("private-username") })
        val restarted = CustomerSnapshotStore(directory, cipher)
        restarted.selectAccount("alice")
        assertEquals("private-username", restarted.read("alice", "api/me")?.payload)
        assertEquals(1234L, restarted.read("alice", "api/me")?.savedAt)
        assertNull(restarted.read("bob", "api/me"))
    }

    @Test fun logoutAndAccountSwitchRejectLateWritesButKeepPublicFixtures() {
        val store = CustomerSnapshotStore(temporary.newFolder(), TestSnapshotCipher())
        store.selectAccount("alice")
        val generation = store.generation()
        store.write("alice", "api/me", "alice", generation)
        store.write(CustomerSnapshotStore.PUBLIC, "api/mobile/matches", "fixtures", generation)
        store.clearPrivate()
        assertNull(store.read("alice", "api/me"))
        assertNull(store.write("alice", "api/me", "late", generation))
        assertEquals("fixtures", store.read(CustomerSnapshotStore.PUBLIC, "api/mobile/matches")?.payload)
        store.selectAccount("alice")
        store.write("alice", "api/me", "alice", store.generation())
        store.selectAccount("bob")
        assertNull(store.read("alice", "api/me"))
    }

    @Test fun corruptAndUnsupportedSnapshotsAreDiscarded() {
        val directory = temporary.newFolder(); val cipher = TestSnapshotCipher()
        val store = CustomerSnapshotStore(directory, cipher)
        store.write("alice", "api/me", "ok", store.generation())
        directory.listFiles()!!.single().writeBytes(byteArrayOf(1, 2, 3))
        assertNull(store.read("alice", "api/me"))
        assertEquals(0, directory.listFiles()!!.size)
        store.write("alice", "api/me", "ok", store.generation())
        directory.listFiles()!!.single().writeBytes(cipher.encrypt(Json.encodeToString(
            SavedSnapshot("alice", "api/me", "unsupported", 1, schemaVersion = 2)).encodeToByteArray()))
        assertNull(store.read("alice", "api/me"))
    }

    @Test fun evictionBoundsHistoryAndPreservesProfile() {
        val directory = temporary.newFolder(); var clock = 1000L
        val store = CustomerSnapshotStore(directory, TestSnapshotCipher(), maxBytes = 900, now = { clock++ })
        store.write("alice", "api/me", "profile", store.generation())
        for (index in 1..8) store.write("alice", "api/my-bet?id=$index", "x".repeat(250), store.generation())
        assertTrue(directory.listFiles()!!.filter { it.name.endsWith(".snapshot") }.sumOf { it.length() } <= 900)
        assertEquals("profile", store.read("alice", "api/me")?.payload)
        assertNull(store.read("alice", "api/my-bet?id=1"))
        assertNotNull(store.read("alice", "api/my-bet?id=8"))
    }
}
