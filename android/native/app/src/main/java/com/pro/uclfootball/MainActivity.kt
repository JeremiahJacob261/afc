package com.pro.uclfootball

import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.core.view.WindowCompat
import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.pro.uclfootball.auth.LoginViewModel
import com.pro.uclfootball.auth.LoginError
import com.pro.uclfootball.auth.PasswordRecoveryRoute
import com.pro.uclfootball.account.AccountRoute
import com.pro.uclfootball.bets.BetsRoute
import com.pro.uclfootball.bets.BetDetailRoute
import com.pro.uclfootball.home.DashboardRoute
import com.pro.uclfootball.match.MatchDetailRoute
import com.pro.uclfootball.match.MatchesRoute
import com.pro.uclfootball.notifications.NotificationsRoute
import com.pro.uclfootball.transactions.TransactionsRoute
import com.pro.uclfootball.referrals.ReferralsRoute
import com.pro.uclfootball.account.VipRoute
import com.pro.uclfootball.rewards.WheelRoute
import com.pro.uclfootball.legal.LegalRoute
import com.pro.uclfootball.help.FaqRoute
import com.pro.uclfootball.auth.RegistrationRoute
import com.pro.uclfootball.payments.PaymentFlowRoute
import com.pro.uclfootball.payments.PaymentPage
import com.pro.uclfootball.bets.BetSlipRoute
import com.pro.uclfootball.help.SupportRoute
import com.pro.uclfootball.ui.UclColors
import com.pro.uclfootball.ui.UclSpacing
import com.pro.uclfootball.ui.UclTheme

private val Ink = UclColors.ink
private val Body = UclColors.body
private val Accent = UclColors.accent
private val Paper = UclColors.paper
private val Panel = UclColors.surface
private val Line = UclColors.line
private val DarkGround = UclColors.darkGround

class MainActivity : ComponentActivity() {
    private val incomingAuthLink = mutableStateOf<Uri?>(null)
    private val incomingNotification = mutableStateOf(false)

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        incomingAuthLink.value = intent?.data
        incomingNotification.value = intent?.getBooleanExtra("ucl_notification", false) == true
        val container = (application as UclApplication).container
        setContent {
            UclTheme {
                UclNativeApp(
                    container = container,
                    incomingAuthLink = incomingAuthLink.value,
                    onAuthLinkConsumed = { incomingAuthLink.value = null },
                    incomingNotification = incomingNotification.value,
                    onNotificationConsumed = { incomingNotification.value = false },
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        incomingAuthLink.value = intent.data
        incomingNotification.value = intent.getBooleanExtra("ucl_notification", false)
    }

    override fun onResume() {
        super.onResume()
        (application as UclApplication).container.apiClient.beginForeground()
    }
}

@Composable
private fun UclNativeApp(
    container: UclAppContainer,
    incomingAuthLink: Uri?,
    onAuthLinkConsumed: () -> Unit,
    incomingNotification: Boolean,
    onNotificationConsumed: () -> Unit,
) {
    val navController = rememberNavController()
    val activity = androidx.activity.compose.LocalActivity.current
    val currentRoute by navController.currentBackStackEntryAsState()
    SideEffect {
        activity?.window?.let { window ->
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val insets = WindowCompat.getInsetsController(window, window.decorView)
            insets.isAppearanceLightStatusBars = currentRoute?.destination?.route != "login"
            insets.isAppearanceLightNavigationBars = true
        }
    }
    val loginViewModel: LoginViewModel = viewModel(
        factory = remember(container.loginRepository) {
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T =
                    LoginViewModel(container.loginRepository) as T
            }
        },
    )
    val loginState by loginViewModel.state.collectAsStateWithLifecycle()
    val sessionEnded by container.authSessionRepository.sessionEnded.collectAsStateWithLifecycle()
    androidx.compose.runtime.LaunchedEffect(sessionEnded) {
        if (sessionEnded) {
            loginViewModel.sessionEnded()
            navController.navigate("login") { popUpTo(navController.graph.id) { inclusive = true }; launchSingleTop = true }
        }
    }
    androidx.compose.runtime.LaunchedEffect(currentRoute?.destination?.route) {
        if (currentRoute?.destination?.route == "login" && loginState.signedIn) {
            loginViewModel.retrySessionRestore()
        }
    }
    val pushContext = LocalContext.current
    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.RequestPermission(),
    ) { container.pushManager.synchronize() }
    if (loginState.signedIn) com.pro.uclfootball.ui.RefreshOnResume { container.pushManager.synchronize() }
    androidx.compose.runtime.LaunchedEffect(loginState.signedIn, currentRoute?.destination?.route) {
        if (loginState.signedIn && currentRoute?.destination?.route != "login" && container.pushManager.configured) {
            androidx.compose.runtime.withFrameNanos { }
            androidx.compose.runtime.withFrameNanos { }
            val preferences = pushContext.getSharedPreferences("native_push", android.content.Context.MODE_PRIVATE)
            if (android.os.Build.VERSION.SDK_INT >= 33 && !container.pushManager.permitted() &&
                !preferences.getBoolean("permission_asked", false)) {
                preferences.edit().putBoolean("permission_asked", true).apply()
                permissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
            } else container.pushManager.synchronize()
        }
    }
    androidx.compose.runtime.LaunchedEffect(incomingNotification, loginState.signedIn) {
        if (incomingNotification && loginState.signedIn) {
            navController.navigate("notifications") { launchSingleTop = true }
            onNotificationConsumed()
        }
    }
    com.pro.uclfootball.updates.UpdatePrompt(container)
    androidx.compose.runtime.LaunchedEffect(loginState.signedIn) {
        if (
            loginState.signedIn &&
            !incomingNotification &&
            currentRoute?.destination?.route == "login" &&
            !isAuthRecoveryRedirect(incomingAuthLink)
        ) {
            navController.navigate("home") {
                popUpTo("login") { inclusive = true }
                launchSingleTop = true
            }
        }
    }
    androidx.compose.runtime.LaunchedEffect(incomingAuthLink) {
        if (isAuthRecoveryRedirect(incomingAuthLink)) {
            navController.navigate("reset") { launchSingleTop = true }
        } else {
            nativeReferralCode(incomingAuthLink)?.let { referral ->
                navController.navigate("register?refer=${Uri.encode(referral)}") { launchSingleTop = true }
                onAuthLinkConsumed()
            }
        }
    }

    UserRouteFrame(currentRoute?.destination?.route.orEmpty(), onNavigate = { route ->
        navController.navigate(route) { launchSingleTop = true }
    }) {
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                state = loginState,
                onIdentityChange = loginViewModel::setIdentity,
                onPasswordChange = loginViewModel::setPassword,
                onTogglePassword = loginViewModel::togglePasswordVisibility,
                onSubmit = loginViewModel::signIn,
                onRetrySession = loginViewModel::retrySessionRestore,
                onRegister = { navController.navigate("register") },
                onReset = { navController.navigate("reset") },
                onOpenPrivacy = { navController.navigate("privacy") },
                onOpenTerms = { navController.navigate("terms") },
            )
        }
        composable("privacy") {
            LegalRoute(isTerms = false, onBack = { navController.popBackStack() })
        }
        composable("terms") {
            LegalRoute(isTerms = true, onBack = { navController.popBackStack() })
        }
        composable("faq") {
            FaqRoute(onBack = { navController.popBackStack("account", false) })
        }
        composable("register?refer={refer}", arguments = listOf(navArgument("refer") { defaultValue = ""; type = NavType.StringType })) { entry ->
            RegistrationRoute(
                container = container,
                referral = entry.arguments?.getString("refer").orEmpty(),
                onLogin = { navController.navigate("login") { popUpTo("login") { inclusive = true }; launchSingleTop = true } },
                onPrivacy = { navController.navigate("privacy") },
                onTerms = { navController.navigate("terms") },
            )
        }
        composable("reset") {
            PasswordRecoveryRoute(
                container = container,
                incomingLink = incomingAuthLink,
                onBackToLogin = { navController.navigate("login") { popUpTo("login") { inclusive = true }; launchSingleTop = true } },
                onLinkConsumed = onAuthLinkConsumed,
            )
        }
        composable("home") {
            DashboardRoute(
                container = container,
                selectedTab = "home",
                onOpenBet = { betId -> navController.navigate("bet/${Uri.encode(betId)}") },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onOpenMatch = { matchId -> navController.navigate("match/${Uri.encode(matchId)}") },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable("matches") {
            MatchesRoute(
                container = container,
                onBack = { navController.navigate("home") { launchSingleTop = true } },
                onTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onMatch = { matchId -> navController.navigate("match/${Uri.encode(matchId)}") },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable(
            route = "match/{matchId}",
            arguments = listOf(navArgument("matchId") { type = NavType.StringType }),
        ) { entry ->
            MatchDetailRoute(
                matchId = entry.arguments?.getString("matchId").orEmpty(),
                container = container,
                onBack = { navController.popBackStack() },
                onSelectMarket = { market -> navController.navigate("bet-slip/${Uri.encode(entry.arguments?.getString("matchId").orEmpty())}/${Uri.encode(market)}") },
            )
        }
        composable("bet-slip/{matchId}/{market}", arguments = listOf(
            navArgument("matchId") { type = NavType.StringType }, navArgument("market") { type = NavType.StringType },
        )) { entry ->
            MatchDetailRoute(entry.arguments?.getString("matchId").orEmpty(), container,
                onBack = { navController.popBackStack() }, onSelectMarket = { })
            BetSlipRoute(container, entry.arguments?.getString("matchId").orEmpty(), entry.arguments?.getString("market").orEmpty(),
                onBack = { navController.popBackStack() }, onBets = { navController.navigate("bets") },
                onBet = { id -> navController.navigate("bet/${Uri.encode(id)}") },
                onSignInRequired = { navController.navigate("login") { popUpTo("home") { inclusive = true } } })
        }
        composable("bets") {
            BetsRoute(
                container = container,
                selectedTab = "bets",
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onOpenBet = { betId -> navController.navigate("bet/${Uri.encode(betId)}") },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable(
            route = "bet/{betId}",
            arguments = listOf(navArgument("betId") { type = NavType.StringType }),
        ) { entry ->
            BetDetailRoute(
                betId = entry.arguments?.getString("betId").orEmpty(),
                container = container,
                onBack = { navController.popBackStack() },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        listOf("wallet" to PaymentPage.Methods, "deposit" to PaymentPage.Methods, "withdraw" to PaymentPage.Withdraw,
            "bind-wallet" to PaymentPage.BindWallet, "pin" to PaymentPage.Pin).forEach { (route, page) ->
            composable(route) {
                PaymentFlowRoute(container, page, onBack = { navController.popBackStack() },
                    onHistory = { navController.navigate("transactions") },
                    onDone = { withdrawal -> navController.navigate(if (withdrawal) "account" else "home") { popUpTo("home"); launchSingleTop = true } },
                    onSignInRequired = { navController.navigate("login") { popUpTo("home") { inclusive = true } } })
            }
        }
        composable("support") { SupportRoute(container, onBack = { navController.popBackStack() }) }
        composable("account") {
            AccountRoute(
                container = container,
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onOpenNotifications = { navController.navigate("notifications") },
                onOpenHistory = { navController.navigate("transactions") },
                onOpenBets = { navController.navigate("bets") },
                onOpenWallet = { navController.navigate("wallet") },
                onOpenDeposit = { navController.navigate("deposit") },
                onOpenWithdraw = { navController.navigate("withdraw") },
                onOpenPin = { navController.navigate("pin") },
                onOpenSupport = { navController.navigate("support") },
                onOpenReferrals = { navController.navigate("referrals") },
                onOpenVip = { navController.navigate("vip") },
                onOpenWheel = { navController.navigate("wheel") },
                onOpenFaq = { navController.navigate("faq") },
                onSignOutComplete = {
                    loginViewModel.sessionEnded()
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable("notifications") {
            NotificationsRoute(
                container = container,
                onBack = { navController.popBackStack("home", false) },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onOpenMatch = { matchId -> navController.navigate("match/${Uri.encode(matchId)}") },
                onOpenBet = { betId -> navController.navigate("bet/${Uri.encode(betId)}") },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable("transactions") {
            TransactionsRoute(
                container = container,
                onBack = { navController.popBackStack("home", false) },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable("referrals") {
            ReferralsRoute(
                container = container,
                onBack = { navController.popBackStack("account", false) },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable("vip") {
            VipRoute(
                container = container,
                onBack = { navController.popBackStack("account", false) },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
        composable("wheel") {
            WheelRoute(
                container = container,
                onBack = { navController.popBackStack("account", false) },
                onSelectTab = { route -> navController.navigate(route) { launchSingleTop = true } },
                onSignInRequired = {
                    navController.navigate("login") { popUpTo("home") { inclusive = true } }
                },
            )
        }
    }
    }
}

@Composable
private fun UserRouteFrame(route: String, onNavigate: (String) -> Unit, content: @Composable () -> Unit) {
    val customerPage = route.isNotBlank() && route !in listOf("login", "reset", "privacy", "terms") && !route.startsWith("register")
    if (customerPage) com.pro.uclfootball.ui.UserWebShell(route, onNavigate, content) else content()
}

private fun isAuthRecoveryRedirect(uri: Uri?): Boolean {
    if (uri == null) return false
    val expected = Uri.parse(BuildConfig.AUTH_REDIRECT_URI)
    return uri.scheme == expected.scheme && uri.host == expected.host && uri.path == expected.path
}

private fun nativeReferralCode(uri: Uri?): String? {
    if (uri == null || uri.scheme != Uri.parse(BuildConfig.AUTH_REDIRECT_URI).scheme || uri.host != "register") return null
    return uri.path?.removePrefix("/")?.takeIf { Regex("[0-9]{1,16}").matches(it) }
}

@Composable
private fun LoginScreen(
    state: com.pro.uclfootball.auth.LoginUiState,
    onIdentityChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onTogglePassword: () -> Unit,
    onSubmit: () -> Unit,
    onRetrySession: () -> Unit,
    onRegister: () -> Unit,
    onReset: () -> Unit,
    onOpenPrivacy: () -> Unit,
    onOpenTerms: () -> Unit,
) {
    val scrollState = rememberScrollState()
    Surface(modifier = Modifier.fillMaxSize(), color = Paper) {
        if (state.isCheckingSession) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(stringResource(R.string.login_checking_session), color = Body)
            }
            return@Surface
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .imePadding(),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .background(DarkGround),
            ) {
                Image(
                    painter = painterResource(R.drawable.login_hero),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
                Box(Modifier.fillMaxSize().background(Color(0xCC080F32)))
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .windowInsetsPadding(WindowInsets.statusBars)
                        .padding(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 68.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "UCL",
                            color = Paper,
                            fontFamily = FontFamily.Serif,
                            fontSize = 32.sp,
                            lineHeight = 36.sp,
                        )
                        Text(
                            text = stringResource(R.string.common_join_now),
                            color = Paper,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier
                                .clip(RoundedCornerShape(24.dp))
                                .border(2.dp, Paper, RoundedCornerShape(24.dp))
                                .clickable(onClick = onRegister)
                                .sizeIn(minWidth = UclSpacing.minimumTouchTarget, minHeight = UclSpacing.minimumTouchTarget)
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                        )
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = stringResource(R.string.login_title),
                            color = Paper,
                            fontFamily = FontFamily.Serif,
                            fontSize = 32.sp,
                            lineHeight = 36.sp,
                        )
                        Text(
                            text = stringResource(R.string.login_subtitle),
                            color = Paper.copy(alpha = 0.76f),
                            fontSize = 16.sp,
                        )
                    }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(top = 0.dp)
                    .offset(y = (-56).dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Panel)
                    .border(2.dp, Line, RoundedCornerShape(16.dp))
                    .padding(22.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = stringResource(R.string.login_identity_label),
                        color = Ink,
                        fontWeight = FontWeight.SemiBold,
                    )
                    NativeInput(
                        value = state.identity,
                        onValueChange = onIdentityChange,
                        placeholder = stringResource(R.string.login_identity_placeholder),
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                        contentDescription = stringResource(R.string.login_identity_label),
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = stringResource(R.string.login_password_label),
                            color = Ink,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = stringResource(R.string.login_forgot_password),
                            color = Accent,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clickable(onClick = onReset)
                                .sizeIn(minWidth = UclSpacing.minimumTouchTarget, minHeight = UclSpacing.minimumTouchTarget)
                                .padding(vertical = 12.dp),
                        )
                    }
                    NativeInput(
                        value = state.password,
                        onValueChange = onPasswordChange,
                        placeholder = "••••••••",
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                        passwordVisible = state.passwordVisible,
                        trailingLabel = if (state.passwordVisible) "Hide" else "Show",
                        onTrailingClick = onTogglePassword,
                        contentDescription = stringResource(R.string.login_password_label),
                        onImeAction = onSubmit,
                    )
                }

                if (state.error != null) {
                    Text(
                        text = stringResource(
                            when (state.error) {
                                LoginError.InvalidCredentials -> R.string.login_error_invalid_credentials
                                LoginError.Network -> R.string.login_error_network
                                LoginError.General -> R.string.login_error_general
                            },
                        ),
                        color = Color(0xFF9A1B1B),
                        fontSize = 14.sp,
                    )
                }
                if (state.sessionRecoveryFailed) {
                    TextButton(onClick = onRetrySession) {
                        Text(stringResource(R.string.common_retry), color = Accent)
                    }
                }

                Button(
                    onClick = onSubmit,
                    enabled = !state.isSubmitting && state.identity.isNotBlank() && state.password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Accent,
                        contentColor = Paper,
                        disabledContainerColor = Accent.copy(alpha = 0.55f),
                        disabledContentColor = Paper,
                    ),
                ) {
                    Text(
                        text = if (state.isSubmitting) stringResource(R.string.login_submitting)
                        else stringResource(R.string.login_submit),
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("→", fontSize = 20.sp)
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(width = 0.dp, color = Color.Transparent)
                        .padding(top = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Spacer(Modifier.fillMaxWidth().height(2.dp).background(Line))
                    Spacer(Modifier.height(20.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.login_new_account), color = Body)
                        TextButton(onClick = onRegister) {
                            Text(
                                text = stringResource(R.string.common_create_account),
                                color = Accent,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        TextButton(onClick = onOpenPrivacy) {
                            Text(stringResource(R.string.legal_privacy_title), color = Accent, fontSize = 12.sp)
                        }
                        TextButton(onClick = onOpenTerms) {
                            Text(stringResource(R.string.legal_terms_title), color = Accent, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NativeInput(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType,
    imeAction: ImeAction,
    contentDescription: String,
    passwordVisible: Boolean = true,
    trailingLabel: String? = null,
    onTrailingClick: (() -> Unit)? = null,
    onImeAction: (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(Paper)
            .border(2.dp, Line, RoundedCornerShape(8.dp))
            .padding(start = 14.dp, end = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = TextStyle(color = Ink, fontSize = 16.sp),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
            keyboardActions = KeyboardActions(onDone = { onImeAction?.invoke() }),
            visualTransformation = if (keyboardType == KeyboardType.Password && !passwordVisible) {
                PasswordVisualTransformation()
            } else {
                VisualTransformation.None
            },
            modifier = Modifier.weight(1f),
            decorationBox = { innerTextField ->
                Box(contentAlignment = Alignment.CenterStart) {
                    if (value.isEmpty()) Text(placeholder, color = Body.copy(alpha = 0.65f), fontSize = 16.sp)
                    innerTextField()
                }
            },
        )
        if (trailingLabel != null && onTrailingClick != null) {
            Text(
                text = trailingLabel,
                color = Accent,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .clickable(onClick = onTrailingClick)
                    .sizeIn(minWidth = UclSpacing.minimumTouchTarget, minHeight = UclSpacing.minimumTouchTarget)
                    .padding(horizontal = 8.dp, vertical = 14.dp),
            )
        }
    }
}
