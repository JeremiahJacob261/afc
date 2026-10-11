package com.pro.uclfootball.match

import com.pro.uclfootball.network.*
import com.pro.uclfootball.ui.matchStartMillis

class FixturesRepository(private val api: NativeApiClient) {
    suspend fun load(limit: Int = 50, oncePerForeground: Boolean = false,
        onCached: (List<MatchSummaryDto>) -> Unit = {}): List<MatchSummaryDto> =
        api.getJson<MatchesResponse>("api/mobile/matches?limit=${limit.coerceIn(1, 50)}",
            oncePerForeground = oncePerForeground, onCached = { onCached(it.matches) }).matches
}

internal fun upcomingMatches(matches: List<MatchSummaryDto>, now: Long): List<MatchSummaryDto> =
    matches.filter { it.verified == false && (matchStartMillis(it.tsgmt, it.date, it.time) ?: 0) > now }
        .sortedBy { matchStartMillis(it.tsgmt, it.date, it.time) }
