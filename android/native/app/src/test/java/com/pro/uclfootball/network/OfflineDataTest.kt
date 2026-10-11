package com.pro.uclfootball.network

import com.pro.uclfootball.auth.*
import com.pro.uclfootball.cache.*
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class OfflineDataTest {
    @get:Rule val temporary = TemporaryFolder()
    private val config = NativeApiConfig("https://example.com/".toHttpUrl(), "https://example.com/".toHttpUrl(), "public-test-key")
    private val savedProfile = """{"status":"success","profile":{"username":"Alice","balance":123}}"""
    private fun http(block: (Interceptor.Chain) -> Response) = OkHttpClient.Builder().addInterceptor(block).build()
    private fun response(chain: Interceptor.Chain, body: String, code: Int = 200) = Response.Builder()
        .request(chain.request()).protocol(Protocol.HTTP_1_1).code(code).message("test")
        .body(body.toResponseBody("application/json".toMediaType())).build()
    private fun store() = CustomerSnapshotStore(temporary.newFolder(), TestSnapshotCipher()).also { it.selectAccount("alice") }

    @Test fun expiredStoredLoginRestoresWithoutAnyNetworkOrRefresh() = runBlocking {
        val requests = AtomicInteger()
        val auth = SupabaseAuthClient(config, httpClient = http { requests.incrementAndGet(); throw IOException("offline") })
        val local = object : SessionStore {
            var session: SupabaseSession? = SupabaseSession("expired", "refresh", 1, expiresAtEpochSeconds = 1, user = SupabaseUser("alice"))
            override fun read() = session
            override fun write(session: SupabaseSession) { this.session = session }
            override fun clear() { session = null }
        }
        val sessions = AuthSessionRepository(auth, local, nowEpochSeconds = { 5000 })
        val api = NativeApiClient(config, sessions::getValidAccessToken, httpClient = http { requests.incrementAndGet(); throw IOException("offline") })
        assertTrue(LoginRepository(api, sessions).restoreSession())
        assertEquals(0, requests.get())
        try { sessions.getValidAccessToken(); fail("Expired token must attempt refresh for online work") } catch (_: IOException) { }
        assertNotNull(local.read())
        assertFalse(sessions.sessionEnded.value)
    }

    @Test fun cachedContentArrivesBeforeAuthorizationAndSurvivesOfflineFailure() = runBlocking {
        val store = store(); store.write("alice", "api/me", savedProfile, store.generation())
        var hydrated = false
        val api = NativeApiClient(config, accessToken = { assertTrue(hydrated); "token" },
            httpClient = http { throw IOException("offline") }, snapshots = store, accountId = { "alice" })
        try {
            api.getJson<MeResponse>("api/me", true, onCached = { assertEquals("Alice", it.profile.username); hydrated = true })
            fail("Expected offline error")
        } catch (_: IOException) { }
        assertTrue(hydrated)
        assertTrue(api.cacheStatus.value["api/me"]!!.fromCache)
        assertFalse(api.cacheStatus.value["api/me"]!!.refreshing)
        assertEquals(savedProfile, store.read("alice", "api/me")?.payload)
    }

    @Test fun successfulRefreshReplacesSnapshotAndForegroundReuseAvoidsRefetch() = runBlocking {
        val store = store(); store.write("alice", "api/me", savedProfile, store.generation())
        val calls = AtomicInteger()
        val api = NativeApiClient(config, { "token" }, httpClient = http { chain ->
            calls.incrementAndGet(); response(chain, savedProfile.replace("Alice", "Updated")
                .replace("\"username\"", "\"password\":\"DO_NOT_SAVE\",\"pin\":\"7391\",\"username\""))
        }, snapshots = store, accountId = { "alice" })
        assertEquals("Updated", api.getJson<MeResponse>("api/me", true, onCached = {}, oncePerForeground = true).profile.username)
        api.getJson<MeResponse>("api/me", true, oncePerForeground = true)
        assertEquals(1, calls.get())
        assertFalse(api.cacheStatus.value["api/me"]!!.fromCache)
        assertTrue(store.read("alice", "api/me")!!.payload.contains("Updated"))
        assertFalse(store.read("alice", "api/me")!!.payload.contains("DO_NOT_SAVE"))
        assertFalse(store.read("alice", "api/me")!!.payload.contains("7391"))
        api.beginForeground()
        api.getJson<MeResponse>("api/me", true, oncePerForeground = true)
        assertEquals(2, calls.get())
    }

    @Test fun serverErrorsDoNotOverwriteSavedDataOrBecomeSuccessfulReads() = runBlocking {
        val store = store(); store.write("alice", "api/me", savedProfile, store.generation())
        val api = NativeApiClient(config, { "token" }, httpClient = http { response(it, "{}", 503) }, snapshots = store, accountId = { "alice" })
        try { api.getJson<MeResponse>("api/me", true, onCached = {}); fail("Expected server error") } catch (e: ApiException) { assertEquals(503, e.httpStatus) }
        assertEquals(savedProfile, store.read("alice", "api/me")?.payload)
    }

    @Test fun overlappingReadsShareRequestAndLateAccountResponseIsDiscarded() = runBlocking {
        val store = store(); val calls = AtomicInteger(); val started = CountDownLatch(1); val release = CountDownLatch(1)
        var owner = "alice"
        val api = NativeApiClient(config, { "token" }, httpClient = http { chain ->
            calls.incrementAndGet(); started.countDown(); check(release.await(5, TimeUnit.SECONDS)); response(chain, savedProfile)
        }, snapshots = store, accountId = { owner })
        supervisorScope {
            val first = async { api.getJson<MeResponse>("api/me", true) }
            withContext(Dispatchers.IO) { check(started.await(5, TimeUnit.SECONDS)) }
            val second = async { api.getJson<MeResponse>("api/me", true) }
            delay(50)
            owner = "bob"; store.selectAccount("bob"); release.countDown()
            for (result in listOf(first, second)) {
                try { result.await(); fail("Old account response must be rejected") } catch (_: CancellationException) { }
            }
        }
        assertEquals(1, calls.get())
        assertNull(store.read("alice", "api/me")); assertNull(store.read("bob", "api/me"))
    }

    @Test fun quotesAndMutationsNeverUseOrSaveOfflineResponses() = runBlocking {
        val store = store()
        val api = NativeApiClient(config, { "token" }, httpClient = http { response(it, """{"status":"success","rate":1,"ledgerAmount":1,"valid":true}""") }, snapshots = store, accountId = { "alice" })
        api.getJson<DepositQuoteDto>("api/mobile/deposit-quote?method=mmk&amount=1", true)
        assertNull(store.read("alice", "api/mobile/deposit-quote?method=mmk&amount=1"))
        val offline = NativeApiClient(config, { "token" }, httpClient = http { throw IOException("offline") }, snapshots = store, accountId = { "alice" })
        try { offline.post("api/wheel-spin", "{\"revision\":1}", true); fail("An offline spin cannot succeed") } catch (_: IOException) { }
        assertNull(store.read("alice", "api/wheel-spin"))
    }

    @Test fun logoutDuringTokenRefreshCannotRestoreSession() = runBlocking {
        val started = CountDownLatch(1); val release = CountDownLatch(1)
        val auth = SupabaseAuthClient(config, httpClient = http { chain ->
            started.countDown(); check(release.await(5, TimeUnit.SECONDS))
            response(chain, """{"access_token":"new","refresh_token":"new-refresh","expires_in":3600,"user":{"id":"alice"}}""")
        })
        val local = object : SessionStore {
            @Volatile var session: SupabaseSession? = SupabaseSession("expired", "refresh", 1, expiresAtEpochSeconds = 1, user = SupabaseUser("alice"))
            override fun read() = session
            override fun write(session: SupabaseSession) { this.session = session }
            override fun clear() { session = null }
        }
        val sessions = AuthSessionRepository(auth, local, nowEpochSeconds = { 5000 })
        supervisorScope {
            val refreshing = async { sessions.getValidAccessToken() }
            withContext(Dispatchers.IO) { check(started.await(5, TimeUnit.SECONDS)) }
            sessions.clear(); release.countDown()
            try { refreshing.await(); fail("Late refresh must not revive logged-out session") } catch (_: CancellationException) { }
        }
        assertNull(local.read())
        assertTrue(sessions.sessionEnded.value)
    }

    @Test fun missingRecordsDoNotInvalidateSessionButUnauthorizedDoes() = runBlocking {
        val store = store(); var unauthorized = 0; var status = 404
        val api = NativeApiClient(config, { "token" }, httpClient = http { response(it, "{}", status) }, snapshots = store,
            accountId = { "alice" }, onUnauthorized = { _, _ -> unauthorized++ })
        try { api.getJson<MeResponse>("api/me", true); fail("Expected missing record") } catch (e: ApiException) { assertEquals(404, e.httpStatus) }
        assertEquals(0, unauthorized)
        status = 401
        try { api.getJson<MeResponse>("api/me", true); fail("Expected unauthorized") } catch (e: ApiException) { assertEquals(401, e.httpStatus) }
        assertEquals(1, unauthorized)
    }

    @Test fun delayedReadCannotOverwriteSnapshotAfterFinancialAction() = runBlocking {
        val store = store(); store.write("alice", "api/me", savedProfile, store.generation())
        val started = CountDownLatch(1); val release = CountDownLatch(1)
        val api = NativeApiClient(config, { "token" }, httpClient = http { chain ->
            if (chain.request().method == "GET") {
                started.countDown(); check(release.await(5, TimeUnit.SECONDS))
                response(chain, savedProfile.replace("Alice", "Old read"))
            } else response(chain, """{"status":"success"}""")
        }, snapshots = store, accountId = { "alice" })
        supervisorScope {
            val reading = async { api.getJson<MeResponse>("api/me", true, onCached = {}) }
            withContext(Dispatchers.IO) { check(started.await(5, TimeUnit.SECONDS)) }
            api.post("api/wheel-spin", "{}", true)
            release.countDown()
            try { reading.await(); fail("Pre-mutation read must be discarded") } catch (_: CancellationException) { }
        }
        assertEquals(savedProfile, store.read("alice", "api/me")?.payload)
        assertTrue(api.cacheStatus.value["api/me"]!!.fromCache)
    }
}
