package com.pro.uclfootball.cache

import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class CustomerImageDiskCacheTest {
    @get:Rule val temporary = TemporaryFolder()

    @Test fun publicImagesSurviveCacheRecreationAndExpiryKeepsOfflineFallback() {
        val directory = temporary.newFolder()
        var time = System.currentTimeMillis()
        val cache = CustomerImageDiskCache(directory, maxAgeMillis = 1000, now = { time })
        val key = cache.key("https://example.com/prize.png?v=1")
        val bytes = byteArrayOf(1, 2, 3)
        cache.write(key, bytes)
        val recreated = CustomerImageDiskCache(directory, maxAgeMillis = 1000, now = { time })
        assertArrayEquals(bytes, recreated.read(key)!!.readBytes())
        assertTrue(recreated.fresh(recreated.read(key)!!))
        time += 1001
        assertFalse(recreated.fresh(recreated.read(key)!!))
        assertArrayEquals(bytes, recreated.read(key)!!.readBytes())
    }

    @Test fun storageEvictsOldestImagesAndRejectsOversizedEntry() {
        var time = System.currentTimeMillis()
        val cache = CustomerImageDiskCache(temporary.newFolder(), maxBytes = 6, now = { time })
        cache.write("first", ByteArray(4))
        time += 1000
        cache.write("second", ByteArray(4))
        assertNull(cache.read("first"))
        assertNotNull(cache.read("second"))
        cache.write("oversized", ByteArray(7))
        assertNull(cache.read("oversized"))
        assertNotNull(cache.read("second"))
    }

    @Test fun differentUrlsNeverShareCachedArtwork() {
        val cache = CustomerImageDiskCache(temporary.newFolder())
        val first = cache.key("https://example.com/prize.png?v=1")
        val second = cache.key("https://example.com/prize.png?v=2")
        cache.write(first, byteArrayOf(1))
        cache.write(second, byteArrayOf(2))
        assertArrayEquals(byteArrayOf(1), cache.read(first)!!.readBytes())
        assertArrayEquals(byteArrayOf(2), cache.read(second)!!.readBytes())
    }

    @Test fun refreshedArtworkReplacesExpiredBytesAndResetsAge() {
        var time = System.currentTimeMillis()
        val cache = CustomerImageDiskCache(temporary.newFolder(), maxAgeMillis = 1000, now = { time })
        val key = cache.key("https://example.com/prize.png")
        cache.write(key, byteArrayOf(1))
        time += 2000
        assertFalse(cache.fresh(cache.read(key)!!))
        cache.write(key, byteArrayOf(2))
        assertArrayEquals(byteArrayOf(2), cache.read(key)!!.readBytes())
        assertTrue(cache.fresh(cache.read(key)!!))
    }
}
