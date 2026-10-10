package com.pro.uclfootball.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class AuthSessionRepository(
    private val authClient: SupabaseAuthClient,
    private val sessionStore: EncryptedSessionStore,
    private val nowEpochSeconds: () -> Long = { System.currentTimeMillis() / 1_000L },
) {
    private val refreshMutex = Mutex()

    suspend fun signIn(email: String, password: String): SupabaseSession {
        val session = authClient.signInWithPassword(email, password).withResolvedExpiry()
        persist(session)
        return session
    }

    suspend fun getValidAccessToken(): String? = refreshMutex.withLock {
        val session = withContext(Dispatchers.IO) { sessionStore.read() } ?: return null
        val expiry = session.resolvedExpiry()
        if (expiry > nowEpochSeconds() + REFRESH_SKEW_SECONDS) {
            return session.accessToken
        }

        try {
            val refreshed = authClient.refreshSession(session.refreshToken).withResolvedExpiry()
            persist(refreshed)
            refreshed.accessToken
        } catch (error: SupabaseAuthException) {
            if (error.httpStatus == 400 || error.httpStatus == 401) {
                clear()
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
        withContext(Dispatchers.IO) { sessionStore.clear() }
    }

    private suspend fun persist(session: SupabaseSession) {
        withContext(Dispatchers.IO) { sessionStore.write(session) }
    }

    private fun SupabaseSession.withResolvedExpiry(): SupabaseSession =
        copy(expiresAtEpochSeconds = resolvedExpiry())

    private fun SupabaseSession.resolvedExpiry(): Long =
        expiresAtEpochSeconds ?: (nowEpochSeconds() + expiresInSeconds)

    private companion object {
        const val REFRESH_SKEW_SECONDS = 90L
    }
}
