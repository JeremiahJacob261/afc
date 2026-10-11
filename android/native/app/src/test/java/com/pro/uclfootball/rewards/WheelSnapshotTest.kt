package com.pro.uclfootball.rewards

import com.pro.uclfootball.network.WheelStateResponse
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.*
import org.junit.Test

class WheelSnapshotTest {
    @Test fun restoringPreviousAwardDoesNotReplayCelebration() {
        val saved = WheelStateResponse(revision = 1, items = emptyList(), lastPrize = "Previous win", lastAmount = JsonPrimitive(500))
        val restored = restoreWheelSnapshot(WheelUiState(), saved)
        assertSame(saved, restored.wheel)
        assertTrue(restored.hasContent)
        assertFalse(restored.isLoading)
        assertNull(restored.result)
        assertNull(restored.celebration)
        assertNull(restored.recoveredAward)
        assertEquals(0L, restored.resultId)
    }
}
