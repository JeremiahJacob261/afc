package com.pro.uclfootball.network

import kotlinx.coroutines.runBlocking
import okhttp3.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Test
import org.junit.Rule
import org.junit.rules.TemporaryFolder
import com.pro.uclfootball.cache.*
import com.pro.uclfootball.match.*
import java.io.IOException

class MatchLoadingTest {
    @get:Rule val temporary = TemporaryFolder()
    private fun client(body: String) = NativeApiClient(
        NativeApiConfig("https://example.com/".toHttpUrl(), null, ""),
        httpClient = OkHttpClient.Builder().addInterceptor { chain ->
            Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1)
                .code(200).message("OK").body(body.toResponseBody("application/json".toMediaType())).build()
        }.build(),
    )

    @Test fun futureFixturesWithBooleanCompanyReachTheList() = runBlocking {
        for (field in listOf("\"company\":false,", "\"company\":true,", "\"company\":null,", "")) {
            val api = client("""{"status":"success","matches":[{${field}"match_id":"1551572","home":"Ružomberok","away":"Žilina","tsgmt":1893456000000,"verified":false,"onenil":"0.650","oneone":"0.730","onetwo":"0.080"}]}""")
            val result = api.getJson<MatchesResponse>("api/mobile/matches?limit=50")
            assertEquals(1, result.matches.size)
            assertEquals(1, com.pro.uclfootball.match.upcomingMatches(result.matches, 1893455999999).size)
            assertEquals("1551572", result.matches.single().matchId.textValue())
        }
    }

    @Test fun booleanCompanyAlsoLoadsMatchDetails() = runBlocking {
        for (field in listOf("\"company\":false,", "\"company\":true,", "\"company\":null,", "")) {
            val api = client("""{"status":"success","match":{${field}"match_id":"1551572","tsgmt":1893456000000,"comarket":"nilnil"}}""")
            assertEquals("1551572", api.getJson<MatchResponse>("api/mobile/match?id=1551572").match.matchId.textValue())
        }
    }

    @Test fun fixtureSnapshotRestoresOfflineExcludesPastAndRefreshesAfterRetry() = runBlocking {
        val store = CustomerSnapshotStore(temporary.newFolder(), object : SnapshotCipher {
            override fun encrypt(plaintext: ByteArray) = plaintext
            override fun decrypt(ciphertext: ByteArray) = ciphertext
        })
        val path = "api/mobile/matches?limit=50"
        val now = System.currentTimeMillis()
        val body = """{"status":"success","matches":[{"match_id":"future","company":true,"verified":false,"tsgmt":${now + 3600000}},{"match_id":"past","company":false,"verified":false,"tsgmt":${now - 3600000}}]}"""
        store.write(CustomerSnapshotStore.PUBLIC, path, body, store.generation())
        var online = false
        val api = NativeApiClient(NativeApiConfig("https://example.com/".toHttpUrl(), null, ""),
            httpClient = OkHttpClient.Builder().addInterceptor { chain ->
                if (!online) throw IOException("offline")
                Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).code(200).message("OK")
                    .body(body.toResponseBody("application/json".toMediaType())).build()
            }.build(), snapshots = store)
        var restored = emptyList<MatchSummaryDto>()
        try { FixturesRepository(api).load(onCached = { restored = upcomingMatches(it, now) }); fail("Expected offline failure") }
        catch (_: IOException) { }
        assertEquals(listOf("future"), restored.map { it.matchId.textValue() })
        online = true
        assertEquals(1, upcomingMatches(FixturesRepository(api).load(), now).size)
        api.beginForeground()
        assertEquals(1, upcomingMatches(FixturesRepository(api).load(oncePerForeground = true), now).size)
    }
}
