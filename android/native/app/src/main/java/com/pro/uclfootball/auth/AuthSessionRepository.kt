package com.pro.uclfootball.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class AuthSessionRepository(
    private val authClient: SupabaseAuthClient,
    private val sessionStore: SessionStore,
    private val nowEpochSeconds: () -> Long = { System.currentTimeMillis() / 1_000L },
    private val onSessionCleared: () -> Unit = {},
    private val onSessionSaved: (SupabaseSession) -> Unit = {},
    private val onSessionStarted: () -> Unit = {},
) {
    private val refreshMutex = Mutex()
    private val storeLock = Any()
    private var generation = 0L
    private val mutableSessionEnded = kotlinx.coroutines.flow.MutableStateFlow(false)
    val sessionEnded: kotlinx.coroutines.flow.StateFlow<Boolean> = mutableSessionEnded

    suspend fun restoreLocalSession(): Boolean = withContext(Dispatchers.IO) {
        synchronized(storeLock) {
            val session = sessionStore.read() ?: return@synchronized false
            if (session.user?.id.isNullOrBlank()) return@synchronized false
            onSessionSaved(session)
            true
        }
    }

    suspend fun signIn(email: String, password: String): SupabaseSession {
        val session = authClient.signInWithPassword(email, password).withResolvedExpiry()
        persist(session)
        return session
    }

    suspend fun getValidAccessToken(): String? = refreshMutex.withLock {
        val expectedGeneration = synchronized(storeLock) { generation }
        val session = withContext(Dispatchers.IO) { sessionStore.read() } ?: return null
        val expiry = session.resolvedExpiry()
        if (expiry > nowEpochSeconds() + REFRESH_SKEW_SECONDS) {
            return session.accessToken
        }

        try {
            val refreshed = authClient.refreshSession(session.refreshToken).withResolvedExpiry()
            withContext(Dispatchers.IO) {
                synchronized(storeLock) {
                    if (generation != expectedGeneration) throw CancellationException("Session changed during refresh")
                    onSessionSaved(refreshed)
                    sessionStore.write(refreshed)
                }
            }
            refreshed.accessToken
        } catch (error: SupabaseAuthException) {
            if (error.httpStatus == 400 || error.httpStatus == 401) {
                withContext(Dispatchers.IO) { synchronized(storeLock) {
                    if (generation != expectedGeneration) throw CancellationException("Session changed during refresh")
                    generation++; sessionStore.clear(); onSessionCleared(); mutableSessionEnded.value = true
                } }
                null
            } else if (expiry > nowEpochSeconds()) {
                session.accessToken
            } else {
                throw error
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            if (expiry > nowEpochSeconds()) session.accessToken else throw error
        }
    }

    suspend fun currentSession(): SupabaseSession? =
        withContext(Dispatchers.IO) { sessionStore.read() }

    suspend fun signOut() {
        val session = withContext(Dispatchers.IO) { sessionStore.read() }
        try {
            if (!session?.accessToken.isNullOrBlank()) {
                authClient.signOut(requireNotNull(session).accessToken)
            }
        } finally {
            clear()
        }
    }

    suspend fun clear() {
        withContext(Dispatchers.IO) {
            synchronized(storeLock) { generation++; sessionStore.clear(); onSessionCleared(); mutableSessionEnded.value = true }
        }
    }

    suspend fun clearIfAccount(userId: String?, stillCurrent: () -> Boolean) {
        withContext(Dispatchers.IO) {
            synchronized(storeLock) {
                if (sessionStore.read()?.user?.id == userId && stillCurrent()) {
                    generation++; sessionStore.clear(); onSessionCleared(); mutableSessionEnded.value = true
                }
            }
        }
    }

    private suspend fun persist(session: SupabaseSession) {
        require(!session.user?.id.isNullOrBlank()) { "A session user is required." }
        withContext(Dispatchers.IO) { synchronized(storeLock) {
            generation++; onSessionStarted(); onSessionSaved(session); sessionStore.write(session); mutableSessionEnded.value = false
        } }
    }

    private fun SupabaseSession.withResolvedExpiry(): SupabaseSession =
        copy(expiresAtEpochSeconds = resolvedExpiry())

    private fun SupabaseSession.resolvedExpiry(): Long =
        expiresAtEpochSeconds ?: (nowEpochSeconds() + expiresInSeconds)

    private companion object {
        const val REFRESH_SKEW_SECONDS = 90L
    }
}
