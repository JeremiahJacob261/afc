package com.pro.uclfootball

import android.app.Application
import com.pro.uclfootball.account.AccountRepository
import com.pro.uclfootball.auth.AuthSessionRepository
import com.pro.uclfootball.auth.EncryptedSessionStore
import com.pro.uclfootball.auth.LoginRepository
import com.pro.uclfootball.auth.SupabaseAuthClient
import com.pro.uclfootball.bets.BetsRepository
import com.pro.uclfootball.notifications.NotificationsRepository
import com.pro.uclfootball.transactions.TransactionsRepository
import com.pro.uclfootball.referrals.ReferralsRepository
import com.pro.uclfootball.rewards.WheelRepository
import com.pro.uclfootball.network.NativeApiClient
import com.pro.uclfootball.network.NativeApiConfig

class UclApplication : Application() {
    lateinit var container: UclAppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = UclAppContainer(this)
    }
}

class UclAppContainer(application: Application) {
    val apiConfig = NativeApiConfig.fromBuildConfig()
    val identityCache = com.pro.uclfootball.cache.CustomerIdentityCache(com.pro.uclfootball.cache.PreferencesIdentityCacheStore(application))
    val sessionStore = EncryptedSessionStore(application)
    val snapshots = com.pro.uclfootball.cache.CustomerSnapshotStore(
        java.io.File(application.filesDir, "customer-snapshots"), com.pro.uclfootball.cache.AndroidSnapshotCipher())
    val authClient = SupabaseAuthClient(apiConfig)
    val authSessionRepository = AuthSessionRepository(authClient, sessionStore, onSessionCleared = {
        identityCache.clear(); snapshots.clearPrivate(); clearApiState()
    }, onSessionSaved = { it.user?.id?.let(snapshots::selectAccount) }, onSessionStarted = {
        identityCache.clear(); snapshots.clearPrivate(); clearApiState()
    })
    val apiClient = NativeApiClient(apiConfig, authSessionRepository::getValidAccessToken,
        snapshots = snapshots, accountId = { authSessionRepository.currentSession()?.user?.id },
        onUnauthorized = { owner, generation -> authSessionRepository.clearIfAccount(owner) { snapshots.generation() == generation } })
    private fun clearApiState() { apiClient.clearPrivateState() }
    val loginRepository = LoginRepository(apiClient, authSessionRepository)
    val betsRepository = BetsRepository(apiClient)
    val notificationsRepository = NotificationsRepository(apiClient)
    val transactionsRepository = TransactionsRepository(apiClient)
    val accountRepository = AccountRepository(apiClient)
    val referralsRepository = ReferralsRepository(apiClient)
    val wheelRepository = WheelRepository(apiClient)
    val pushManager = com.pro.uclfootball.notifications.NativePushManager(application, this)
}
