package com.pro.uclfootball.cache

import java.io.File
import java.security.MessageDigest
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

interface SnapshotCipher {
    fun encrypt(plaintext: ByteArray): ByteArray
    fun decrypt(ciphertext: ByteArray): ByteArray
}

@Serializable
data class SavedSnapshot(val owner: String, val path: String, val payload: String,
    val savedAt: Long, val schemaVersion: Int = 1)

/** Durable app data. Public catalogue snapshots never share a private account namespace. */
class CustomerSnapshotStore(
    private val directory: File,
    private val cipher: SnapshotCipher,
    private val maxBytes: Long = 20L * 1024 * 1024,
    private val now: () -> Long = System::currentTimeMillis,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private var generation = 0L

    @Synchronized fun generation(): Long = generation
    @Synchronized fun invalidateRequests() { generation++ }

    @Synchronized fun selectAccount(userId: String) {
        directory.mkdirs()
        val marker = File(directory, "account")
        val account = hash(userId)
        if (runCatching { marker.readText() }.getOrNull() != account) {
            clearPrivate()
            marker.writeText(account)
        }
    }

    @Synchronized fun clearPrivate() {
        generation++
        directory.listFiles()?.filter { !it.name.startsWith("public-") }?.forEach { it.delete() }
    }

    @Synchronized fun read(owner: String, path: String): SavedSnapshot? {
        val file = file(owner, path)
        if (!file.isFile) return null
        return try {
            val snapshot = json.decodeFromString<SavedSnapshot>(cipher.decrypt(file.readBytes()).decodeToString())
            if (snapshot.schemaVersion != 1 || snapshot.owner != owner || snapshot.path != path) {
                file.delete(); null
            } else snapshot
        } catch (_: Exception) { file.delete(); null }
    }

    @Synchronized fun write(owner: String, path: String, payload: String, expectedGeneration: Long): SavedSnapshot? {
        if (expectedGeneration != generation) return null
        val snapshot = SavedSnapshot(owner, path, payload, now())
        val bytes = cipher.encrypt(json.encodeToString(snapshot).encodeToByteArray())
        if (bytes.size > maxBytes) return null
        directory.mkdirs()
        val target = file(owner, path)
        val temporary = File(directory, target.name + ".tmp")
        try {
            temporary.writeBytes(bytes)
            check(temporary.renameTo(target) || run { target.delete(); temporary.renameTo(target) })
            target.setLastModified(snapshot.savedAt)
            evict()
        } finally { temporary.delete() }
        return snapshot
    }

    @Synchronized fun remove(owner: String, path: String) { file(owner, path).delete() }

    private fun file(owner: String, path: String) = File(directory,
        (if (owner == PUBLIC) "public-" else "private-") + hash("$owner|$path") +
            (if (path == "api/me") ".profile" else ".snapshot"))

    private fun evict() {
        val files = directory.listFiles()?.filter { it.name.endsWith(".snapshot") }.orEmpty().sortedBy { it.lastModified() }
        var total = files.sumOf { it.length() }
        for (file in files) {
            if (total <= maxBytes) break
            val size = file.length()
            if (file.delete()) total -= size
        }
    }

    companion object {
        const val PUBLIC = "public"
        private fun hash(value: String) = MessageDigest.getInstance("SHA-256")
            .digest(value.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
