package com.pro.uclfootball.ui

import android.content.Context
import android.content.res.Configuration
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.rotate
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.em
import com.pro.uclfootball.R
import com.pro.uclfootball.home.NativeBottomBar
import org.json.JSONObject
import java.util.Locale

val LocalUserShell = staticCompositionLocalOf { false }
val LocalUserNavSelectionOverride = staticCompositionLocalOf<MutableState<String?>?> { null }
val WebMuted = UclColors.muted
val WebInter = FontFamily(Font(R.font.web_inter))

@Composable
fun webMoney(value: Double): String = java.text.NumberFormat.getNumberInstance(LocalConfiguration.current.locales[0]).apply { maximumFractionDigits = 3 }.format(value) + " MMK"
val UserContentInsets: WindowInsets @Composable get() = if (LocalUserShell.current) WindowInsets(0, 0, 0, 0) else WindowInsets.safeDrawing
private val dictionaries = mutableMapOf<String, JSONObject>()

/** The website owns customer-facing copy. Keep its dictionaries in the APK as assets. */
@Composable
fun webCopy(key: String, vararg values: Pair<String, Any?>): String {
    val context = LocalContext.current
    val language = LocalConfiguration.current.locales[0].language.let { if (it == "my") "my" else "en" }
    val dictionary = remember(language) {
        dictionaries.getOrPut(language) { context.assets.open("web-copy/$language.json").bufferedReader().use { JSONObject(it.readText()) } }
    }
    fun lookup(path: String): String? {
        var node: Any = dictionary
        for (part in path.split('.')) node = when (node) {
            is JSONObject -> node.opt(part)
            is org.json.JSONArray -> part.toIntOrNull()?.let(node::opt)
            else -> null
        } ?: return null
        return node as? String
    }
    val count = values.firstOrNull { it.first == "count" }?.second?.toString()?.toDoubleOrNull()
    var result = (if (count != null) lookup(key + if (count == 1.0) "_one" else "_other") else null) ?: lookup(key) ?: key
    values.forEach { (name, value) -> result = result.replace("{{$name}}", value?.toString().orEmpty()) }
    return result
}

@Composable
fun webItemCount(key: String): Int {
    val context = LocalContext.current
    val language = LocalConfiguration.current.locales[0].language.let { if (it == "my") "my" else "en" }
    return remember(key, language) {
        var node: Any? = dictionaries.getOrPut(language) { context.assets.open("web-copy/$language.json").bufferedReader().use { JSONObject(it.readText()) } }
        key.split('.').forEach { node = (node as? JSONObject)?.opt(it) }
        (node as? org.json.JSONArray)?.length() ?: 0
    }
}

@Composable
fun UserWebShell(route: String, onNavigate: (String) -> Unit, content: @Composable () -> Unit) {
    val ambientRotation by rememberInfiniteTransition(label = "customer-background").animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(90_000, easing = LinearEasing), RepeatMode.Restart), label = "star-ball")
    val navigationOverride = remember(route) { mutableStateOf<String?>(null) }
    val baseContext = LocalContext.current
    val preferences = remember { baseContext.getSharedPreferences("customer_ui", Context.MODE_PRIVATE) }
    var language by remember { mutableStateOf(preferences.getString("language", "my").let { if (it == "my") "my" else "en" }) }
    val configuration = Configuration(LocalConfiguration.current).apply { setLocale(Locale.forLanguageTag(language)) }
    val localizedContext = remember(language, baseContext) { baseContext.createConfigurationContext(configuration) }
    CompositionLocalProvider(LocalUserShell provides true, LocalUserNavSelectionOverride provides navigationOverride, LocalContext provides localizedContext, LocalConfiguration provides configuration) {
        val base = MaterialTheme.typography
        fun TextStyle.webStyle() = copy(platformStyle = PlatformTextStyle(includeFontPadding = false), letterSpacing = 0.sp, lineHeight = 1.5.em)
        MaterialTheme(typography = base.copy(bodyLarge = base.bodyLarge.webStyle(), bodyMedium = base.bodyMedium.webStyle(),
            bodySmall = base.bodySmall.webStyle(), headlineLarge = base.headlineLarge.webStyle(), titleMedium = base.titleMedium.webStyle(),
            labelLarge = base.labelLarge.webStyle(), labelMedium = base.labelMedium.webStyle())) {
            Scaffold(containerColor = UclColors.paper, contentWindowInsets = WindowInsets.safeDrawing,
                topBar = {
                    Column(Modifier.background(Color.White).windowInsetsPadding(WindowInsets.statusBars)) {
                        Row(Modifier.fillMaxWidth().height(68.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween) {
                            IconButton(onClick = { onNavigate("home") }, modifier = Modifier.size(48.dp)) {
                                Image(painterResource(R.drawable.ucl_logo), "UCL", Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                var expanded by remember { mutableStateOf(false) }
                                Box {
                                    Surface(onClick = { expanded = true }, modifier = Modifier.heightIn(min = 48.dp), shape = RoundedCornerShape(8.dp), color = UclColors.surface,
                                        border = BorderStroke(1.dp, UclColors.dashboardLine)) {
                                        Row(Modifier.padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                            Text(if (language == "my") "မြန်မာ" else "English", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                            WebIcon("chevron_down", Modifier.size(14.dp), WebMuted)
                                        }
                                    }
                                    DropdownMenu(expanded, onDismissRequest = { expanded = false }) {
                                        listOf("en" to "English", "my" to "မြန်မာ").forEach { (code, label) ->
                                            DropdownMenuItem(text = { Text(label) }, onClick = {
                                                language = code
                                                preferences.edit().putString("language", code).apply()
                                                expanded = false
                                            })
                                        }
                                    }
                                }
                                Surface(onClick = { onNavigate("notifications") }, modifier = Modifier.size(48.dp), shape = CircleShape,
                                    color = Color.Transparent, border = BorderStroke(1.dp, UclColors.dashboardLine)) {
                                    Box(contentAlignment = Alignment.Center) { WebIcon("bell", Modifier.size(21.dp),
                                        UclColors.ink, webCopy("website.notifications")) }
                                }
                            }
                        }
                        HorizontalDivider(color = UclColors.dashboardLine, thickness = 1.dp)
                        SavedDataIndicator(route)
                    }
                }, bottomBar = { UserBottomNavigation(navigationOverride.value ?: route, onNavigate) }) { padding ->
                Box(Modifier.fillMaxSize().padding(padding)) {
                    Image(painterResource(R.drawable.dashboard_star_ball), null,
                        Modifier.align(Alignment.TopEnd).offset(x = 150.dp, y = 100.dp).size(390.dp).rotate(ambientRotation), alpha = .08f)
                    if (route == "notifications" || route == "transactions") {
                        CompositionLocalProvider(LocalTextStyle provides LocalTextStyle.current.copy(fontFamily = WebInter)) { content() }
                    } else content()
                }
            }
        }
    }
}

@Composable
fun UserBottomNavigation(route: String, onNavigate: (String) -> Unit) {
    val destinations = listOf(Triple("home", "website.home", "home"), Triple("matches", "website.matches", "trophy"),
        Triple("bets", "website.bets", "history"), Triple("wallet", "website.wallet", "wallet"), Triple("account", "website.more", "menu"))
    Column(Modifier.background(Color.White).windowInsetsPadding(WindowInsets.navigationBars)) {
        HorizontalDivider(color = UclColors.dashboardLine, thickness = 1.dp)
        Row(Modifier.fillMaxWidth().height(71.dp).padding(horizontal = 8.dp, vertical = 4.dp)) {
            destinations.forEach { (destination, key, icon) ->
                val color = if (route == destination) UclColors.accent else UclColors.muted
                Column(Modifier.weight(1f).fillMaxHeight().clickable { onNavigate(destination) },
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterVertically)) {
                    WebIcon(icon, Modifier.size(21.dp), color)
                    Text(webCopy(key), color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun WebIcon(name: String, modifier: Modifier = Modifier.size(20.dp), tint: Color = UclColors.ink, description: String? = null) {
    val context = LocalContext.current
    val id = remember(name) { context.resources.getIdentifier("web_$name", "drawable", context.packageName) }
    if (id != 0) Icon(painterResource(id), description, modifier, tint = tint)
}

@Composable
fun WebBack(label: String, onBack: () -> Unit) {
    Row(Modifier.heightIn(min = 44.dp).clickable(onClick = onBack), verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        WebIcon("arrow_left", Modifier.size(18.dp), UclColors.accent)
        Text(label, color = UclColors.accent, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun WebPageHeading(title: String, onBack: () -> Unit, bordered: Boolean = false) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Surface(onClick = onBack, modifier = Modifier.size(if (bordered) 44.dp else 24.dp),
            color = if (bordered) Color.White else Color.Transparent, shape = RoundedCornerShape(8.dp),
            border = if (bordered) BorderStroke(1.dp, UclColors.dashboardLine) else null) {
            Box(contentAlignment = Alignment.Center) { WebIcon("chevron_left", Modifier.size(24.dp), description = webCopy("common.back")) }
        }
        Text(title, fontFamily = FontFamily.Serif, fontSize = 32.sp, color = UclColors.ink, lineHeight = 36.sp)
    }
}

@Composable
fun WebPanel(modifier: Modifier = Modifier, color: Color = Color.White, radius: Int = 16, padding: Int = 20,
    content: @Composable ColumnScope.() -> Unit) {
    Surface(modifier.fillMaxWidth(), color = color, shape = RoundedCornerShape(radius.dp), border = BorderStroke(1.dp, UclColors.dashboardLine)) {
        Column(Modifier.padding(padding.dp), content = content)
    }
}

@Composable
fun WebEmpty(title: String, detail: String, modifier: Modifier = Modifier, height: Int = 260, color: Color = Color.White, icon: String? = null) {
    WebPanel(modifier, color, radius = 12, padding = 16) {
        Column(Modifier.fillMaxWidth().heightIn(min = (height - 32).dp), horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically)) {
            icon?.let { WebIcon(it, Modifier.size(28.dp), WebMuted) }
            Text(title, color = UclColors.ink, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text(detail, color = WebMuted, fontSize = 13.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        }
    }
}

@Composable
fun WebRemoteImage(url: String?, modifier: Modifier, fallback: Int = R.drawable.web_ball, contentScale: ContentScale = ContentScale.Fit) {
    val context = LocalContext.current
    val cache = remember(context.applicationContext) { com.pro.uclfootball.cache.CustomerImageCache.get(context) }
    val source = cache.resolve(url)
    val initial = remember(source, cache) { cache.peek(source) }
    val bitmap by key(source) {
        produceState(initial, source, cache) {
            value = cache.cached(source) ?: value
            value = cache.load(source) ?: value
        }
    }
    bitmap?.let { Image(it.asImageBitmap(), null, modifier, contentScale = contentScale) }
        ?: Image(painterResource(fallback), null, modifier, contentScale = contentScale)
}

/** Translate server-provided copy and values with the same Key convention as user web pages. */
@Composable
fun webApiCopy(key: String, values: kotlinx.serialization.json.JsonElement? = null): String {
    val args = mutableListOf<Pair<String, Any?>>()
    val raw = values as? kotlinx.serialization.json.JsonObject
    raw?.forEach { (name, value) ->
        val text = (value as? kotlinx.serialization.json.JsonPrimitive)?.content ?: value.toString()
        if (name.endsWith("Key")) {
            val label = if (name == "typeKey") "typeLabel" else name.removeSuffix("Key")
            val translated = webCopy(text)
            args.add(label to if (name == "typeKey" || name == "statusKey") translated.lowercase() else translated)
        } else args.add(name to text)
    }
    return webCopy(key, *args.toTypedArray())
}

@Composable
fun webRecordDate(value: String?, fallback: String): String {
    val locale = LocalConfiguration.current.locales[0]
    val time = parseWebInstant(value) ?: return fallback
    return java.text.SimpleDateFormat("dd MMM, HH:mm", locale).format(java.util.Date(time))
}

fun parseWebInstant(value: String?): Long? {
    if (value.isNullOrBlank()) return null
    for (pattern in listOf("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", "yyyy-MM-dd'T'HH:mm:ssXXX", "yyyy-MM-dd HH:mm:ss")) {
        val parsed = runCatching { java.text.SimpleDateFormat(pattern, Locale.ROOT).apply { isLenient = false }.parse(value)?.time }.getOrNull()
        if (parsed != null) return parsed
    }
    return null
}
