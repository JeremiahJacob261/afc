package com.pro.uclfootball.match

import com.pro.uclfootball.network.MatchSummaryDto
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.*
import org.junit.Test

class FixtureVisibilityTest {
    @Test fun cachedPastAndSettledMatchesAreHiddenAndUpcomingAreSorted() {
        val now = 1_893_456_000_000L
        fun match(id: String, offset: Long, verified: Boolean = false) = MatchSummaryDto(
            matchId = JsonPrimitive(id), tsgmt = JsonPrimitive(now + offset), verified = verified)
        val soon = match("soon", 1000)
        val later = match("later", 10000)
        assertEquals(listOf(soon, later), upcomingMatches(listOf(later, match("past", -1), match("kickoff", 0), soon, match("settled", 5000, true)), now))
        assertTrue(upcomingMatches(listOf(match("past", -1)), now).isEmpty())
    }
}
