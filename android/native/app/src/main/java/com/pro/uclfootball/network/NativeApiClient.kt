package com.pro.uclfootball.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit
import com.pro.uclfootball.cache.CustomerSnapshotStore
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.KSerializer
import kotlinx.serialization.serializer
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

data class CachedDataStatus(val savedAt: Long? = null, val fromCache: Boolean = false, val refreshing: Boolean = false)

class NativeApiClient(
    private val config: NativeApiConfig,
    private val accessToken: suspend () -> String? = { null },
    @PublishedApi
    internal val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    },
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .writeTimeout(25, TimeUnit.SECONDS)
        .callTimeout(35, TimeUnit.SECONDS)
        .retryOnConnectionFailure(false)
        .build(),
    private val snapshots: CustomerSnapshotStore? = null,
    private val accountId: suspend () -> String? = { null },
    private val onUnauthorized: suspend (String?, Long?) -> Unit = { _, _ -> },
) {
    private val refreshScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val requestMutex = Mutex()
    private val inFlight = mutableMapOf<String, Deferred<String>>()
    private val foregroundResponses = mutableMapOf<String, String>()
    private var foreground = 0L
    private val mutableCacheStatus = MutableStateFlow<Map<String, CachedDataStatus>>(emptyMap())
    val cacheStatus: StateFlow<Map<String, CachedDataStatus>> = mutableCacheStatus.asStateFlow()

    fun beginForeground() { synchronized(this) { foreground++; foregroundResponses.clear() } }
    fun clearPrivateState() {
        synchronized(this) { foreground++; foregroundResponses.clear() }
        mutableCacheStatus.value = emptyMap()
    }

    suspend fun get(path: String, authenticated: Boolean = false): String =
        execute("GET", path, body = null, authenticated = authenticated)

    suspend fun post(path: String, body: String, authenticated: Boolean = false): String =
        execute("POST", path, body = body, authenticated = authenticated)

    suspend fun postWithToken(path: String, body: String, token: String): String {
        require(token.isNotBlank())
        return execute("POST", path, body, authenticated = true, tokenOverride = token)
    }

    suspend inline fun <reified T> getJson(
        path: String,
        authenticated: Boolean = false,
        noinline onCached: ((T) -> Unit)? = null,
        oncePerForeground: Boolean = false,
    ): T = getData(path, authenticated, serializer<T>(), onCached, oncePerForeground)

    suspend fun <T> getData(path: String, authenticated: Boolean, serializer: KSerializer<T>,
        onCached: ((T) -> Unit)?, oncePerForeground: Boolean): T {
        val owner = if (authenticated) accountId() else CustomerSnapshotStore.PUBLIC
        val generation = snapshots?.generation()
        val eligible = owner != null && cacheable(path)
        if (eligible && onCached != null) {
            val saved = withContext(Dispatchers.IO) { runCatching { snapshots?.read(owner, path) }.getOrNull() }
            val decoded = saved?.let { runCatching { json.decodeFromString(serializer, it.payload) }.getOrNull() }
            if (decoded != null) {
                checkAccount(owner, authenticated, generation)
                onCached(decoded)
                mutableCacheStatus.update { it + (path to CachedDataStatus(saved.savedAt, true, true)) }
                // Give Compose a frame to present restored content before token/network work.
                delay(32)
            }
        }
        mutableCacheStatus.update { it + (path to (it[path] ?: CachedDataStatus()).copy(refreshing = true)) }
        try {
            val response = sharedGet(path, authenticated, owner, generation, oncePerForeground)
            checkAccount(owner, authenticated, generation)
            val decoded = json.decodeFromString(serializer, response)
            val status = runCatching { (json.parseToJsonElement(response) as? kotlinx.serialization.json.JsonObject)?.get("status")?.jsonPrimitive?.contentOrNull }.getOrNull()
            val success = status == null || status.lowercase() in setOf("success", "ok")
            val saved = if (eligible && success) withContext(Dispatchers.IO) {
                // Persist only the decoded DTO, so future unknown server fields cannot cache secrets.
                runCatching { snapshots?.write(owner, path, json.encodeToString(serializer, decoded), generation ?: 0) }.getOrNull()
            } else null
            checkAccount(owner, authenticated, generation)
            mutableCacheStatus.update { it + (path to CachedDataStatus(saved?.savedAt ?: System.currentTimeMillis(), false, false)) }
            return decoded
        } finally {
            if (!authenticated || accountId() == owner && snapshots?.generation() == generation) {
                mutableCacheStatus.update { it + (path to (it[path] ?: CachedDataStatus()).copy(refreshing = false)) }
            }
        }
    }

    private suspend fun sharedGet(path: String, authenticated: Boolean, owner: String?, generation: Long?, oncePerForeground: Boolean): String {
        val epoch = synchronized(this) { foreground }
        val key = "$epoch|$generation|$owner|$path"
        if (oncePerForeground) synchronized(this) { foregroundResponses[key] }?.let { return it }
        val deferred = requestMutex.withLock {
            inFlight[key] ?: refreshScope.async(start = CoroutineStart.LAZY) {
                try {
                    checkAccount(owner, authenticated, generation)
                    val response = get(path, authenticated)
                    checkAccount(owner, authenticated, generation)
                    val status = runCatching { (json.parseToJsonElement(response) as? kotlinx.serialization.json.JsonObject)?.get("status")?.jsonPrimitive?.contentOrNull }.getOrNull()
                    if (cacheable(path) && status != null && status.lowercase() !in setOf("success", "ok")) {
                        throw ApiException(502, runCatching { json.decodeFromString<ApiError>(response) }.getOrNull(), response)
                    }
                    if (oncePerForeground) synchronized(this@NativeApiClient) {
                        if (foreground == epoch) foregroundResponses[key] = response
                    }
                    response
                } finally { requestMutex.withLock { inFlight.remove(key) } }
            }.also { inFlight[key] = it; it.start() }
        }
        return deferred.await()
    }

    private suspend fun checkAccount(owner: String?, authenticated: Boolean, generation: Long?) {
        if (authenticated && (accountId() != owner || snapshots?.generation() != generation)) {
            throw CancellationException("The active account changed")
        }
    }

    private fun cacheable(path: String): Boolean = path.substringBefore('?') in setOf(
        "api/me", "api/my-bets", "api/my-bet", "api/my-transactions", "api/notify", "api/my-referrals",
        "api/wheel-spin", "api/mobile/payment-data", "api/mobile/matches", "api/mobile/match", "api/platform-settings")

    suspend inline fun <reified Request : Any, reified Response : Any> postJson(
        path: String,
        body: Request,
        authenticated: Boolean = false,
    ): Response = json.decodeFromString(post(path, json.encodeToString(body), authenticated))

    private suspend fun execute(
        method: String,
        path: String,
        body: String?,
        authenticated: Boolean,
        tokenOverride: String? = null,
    ): String {
        val requestOwner = if (authenticated && tokenOverride == null) accountId() else null
        val requestGeneration = snapshots?.generation()
        val baseUrl = config.apiBaseUrl
            ?: throw IllegalStateException("HTTPS API base URL is not configured.")
        val requestPath = path.trimStart('/')
        require(requestPath.startsWith("api/")) { "Only same-origin /api endpoints are allowed." }
        require(requestPath.split('/').none { it == ".." }) { "Parent path segments are not allowed." }
        val url = baseUrl.resolve(requestPath)
            ?.takeIf { it.isHttps && it.host == baseUrl.host && it.port == baseUrl.port }
            ?: throw IllegalArgumentException("API path did not resolve to the configured HTTPS origin.")

        val token = if (authenticated) {
            (tokenOverride ?: accessToken())?.takeIf(String::isNotBlank)
                ?: throw ApiException(401, ApiError(message = "An authenticated session is required."), null)
        } else {
            null
        }

        val requestBuilder = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
        if (authenticated && tokenOverride == null) checkAccount(requestOwner, true, requestGeneration)

        if (token != null) {
            requestBuilder.header("Authorization", "Bearer $token")
        }

        val requestBody = body?.toRequestBody(JSON_MEDIA_TYPE)
        val request = when (method) {
            "GET" -> requestBuilder.get().build()
            "POST" -> requestBuilder.post(requestBody ?: ByteArray(0).toRequestBody(JSON_MEDIA_TYPE)).build()
            else -> error("Unsupported HTTP method: $method")
        }

        return withContext(Dispatchers.IO) {
            val response = try {
                httpClient.newCall(request).execute()
            } catch (error: IOException) {
                throw error
            }

            response.use { result ->
                if (authenticated && tokenOverride == null) checkAccount(requestOwner, true, requestGeneration)
                val responseText = result.body.string()
                if (!result.isSuccessful) {
                    if (result.code == 401 && authenticated && tokenOverride == null) {
                        onUnauthorized(requestOwner, requestGeneration)
                        checkAccount(requestOwner, true, requestGeneration)
                    }
                    val parsedError = runCatching { json.decodeFromString<ApiError>(responseText) }.getOrNull()
                    throw ApiException(result.code, parsedError, responseText)
                }
                if (method == "POST" && authenticated) {
                    // A read started before a mutation must not overwrite its newer account state.
                    snapshots?.invalidateRequests()
                    synchronized(this@NativeApiClient) { foregroundResponses.clear() }
                    mutableCacheStatus.update { statuses -> statuses.mapValues { (_, status) ->
                        status.copy(fromCache = status.savedAt != null, refreshing = false)
                    } }
                }
                responseText
            }
        }
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}
