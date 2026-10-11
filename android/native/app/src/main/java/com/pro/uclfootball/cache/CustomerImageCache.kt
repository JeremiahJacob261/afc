package com.pro.uclfootball.cache

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import com.pro.uclfootball.BuildConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit

/** One cache per process, shared by wheel prizes, team crests and payment images. */
class CustomerImageCache private constructor(context: Context) {
    private val disk = CustomerImageDiskCache(File(context.applicationContext.cacheDir, "customer-images"))
    private val memory = object : LruCache<String, Bitmap>(16 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }
    private val locks = Array(32) { Mutex() }
    private val downloads = Semaphore(4)
    private val client = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS).callTimeout(15, TimeUnit.SECONDS).build()

    fun resolve(url: String?): String? = (if (url?.startsWith("/") == true) BuildConfig.API_BASE_URL.trimEnd('/') + url else url)
        ?.takeIf { it.startsWith("https://") }

    fun peek(url: String?): Bitmap? = resolve(url)?.let { memory.get(disk.key(it)) }

    suspend fun cached(url: String?): Bitmap? = withContext(Dispatchers.IO) {
        val source = resolve(url) ?: return@withContext null
        val key = disk.key(source)
        memory.get(key) ?: runCatching { disk.read(key)?.let { decode(it.readBytes()) } }.getOrNull()
            ?.also { memory.put(key, it) }
    }

    suspend fun load(url: String?): Bitmap? = withContext(Dispatchers.IO) {
        val source = resolve(url) ?: return@withContext null
        val key = disk.key(source)
        locks[(key.hashCode() and Int.MAX_VALUE) % locks.size].withLock {
            val previous = cached(source)
            if (previous != null && disk.read(key)?.let(disk::fresh) == true) return@withLock previous
            try {
                downloads.withPermit {
                    client.newCall(Request.Builder().url(source).build()).execute().use { response ->
                        if (!response.isSuccessful) return@withPermit previous
                        val body = response.body
                        if (body.contentLength() > MAX_DOWNLOAD_BYTES) return@withPermit previous
                        val bytes = body.byteStream().use { input ->
                            val output = ByteArrayOutputStream()
                            val buffer = ByteArray(8192)
                            while (true) {
                                val count = input.read(buffer)
                                if (count < 0) break
                                if (output.size() + count > MAX_DOWNLOAD_BYTES) return@withPermit previous
                                output.write(buffer, 0, count)
                            }
                            output.toByteArray()
                        }
                        val bitmap = decode(bytes) ?: return@withPermit previous
                        // Cache failures must never prevent a downloaded image from displaying.
                        runCatching { disk.write(key, bytes) }
                        memory.put(key, bitmap)
                        bitmap
                    }
                }
            } catch (error: CancellationException) { throw error }
            catch (_: Exception) { previous }
        }
    }

    private fun decode(bytes: ByteArray): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 1024) sample *= 2
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sample })
    }

    companion object {
        private const val MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024
        @Volatile private var instance: CustomerImageCache? = null
        fun get(context: Context): CustomerImageCache = instance ?: synchronized(this) {
            instance ?: CustomerImageCache(context).also { instance = it }
        }
    }
}
