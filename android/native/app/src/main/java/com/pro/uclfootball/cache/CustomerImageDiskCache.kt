package com.pro.uclfootball.cache

import java.io.File
import java.security.MessageDigest

/** Bounded, disposable public-image storage. URL hashes keep filenames independent of remote paths. */
internal class CustomerImageDiskCache(
    private val directory: File,
    private val maxBytes: Long = 64L * 1024 * 1024,
    private val maxAgeMillis: Long = 7L * 24 * 60 * 60 * 1000,
    private val now: () -> Long = System::currentTimeMillis,
) {
    init {
        directory.mkdirs()
        directory.listFiles { file -> file.extension == "tmp" }.orEmpty().forEach { it.delete() }
    }

    fun key(url: String): String = MessageDigest.getInstance("SHA-256").digest(url.toByteArray())
        .joinToString("") { "%02x".format(it) }

    @Synchronized fun read(key: String): File? = File(directory, "$key.img").takeIf { it.isFile && it.length() > 0 }
    fun fresh(file: File): Boolean = now() - file.lastModified() in 0 until maxAgeMillis

    @Synchronized fun write(key: String, bytes: ByteArray) {
        if (bytes.isEmpty() || bytes.size > maxBytes) return
        val temporary = File(directory, "$key.tmp")
        try {
            temporary.writeBytes(bytes)
            val target = File(directory, "$key.img")
            if (!temporary.renameTo(target)) {
                // Some filesystems do not allow rename to replace an existing disposable cache entry.
                if (target.exists() && !target.delete()) return
                if (!temporary.renameTo(target)) return
            }
            target.setLastModified(now())
            val files = directory.listFiles { file -> file.extension == "img" }.orEmpty().sortedBy(File::lastModified)
            var total = files.sumOf(File::length)
            for (file in files) {
                if (total <= maxBytes) break
                val size = file.length()
                if (file.delete()) total -= size
            }
        } finally { temporary.delete() }
    }
}
