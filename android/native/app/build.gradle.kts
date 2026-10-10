import org.gradle.api.GradleException
import java.net.URI

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

fun String.asJavaStringLiteral(): String =
    "\"${replace("\\", "\\\\").replace("\"", "\\\"")}\""

fun configuredValue(propertyName: String, environmentName: String): String =
    providers.gradleProperty(propertyName)
        .orElse(providers.environmentVariable(environmentName))
        .orNull
        ?.trim()
        .orEmpty()

val developmentApiBaseUrl = configuredValue("uclDevApiBaseUrl", "UCL_DEV_API_BASE_URL")
val developmentSupabaseUrl = configuredValue("uclDevSupabaseUrl", "UCL_DEV_SUPABASE_URL")
val developmentSupabaseAnonKey = configuredValue("uclDevSupabaseAnonKey", "UCL_DEV_SUPABASE_ANON_KEY")
val productionApiBaseUrl = configuredValue("uclApiBaseUrl", "UCL_API_BASE_URL")
val productionSupabaseUrl = configuredValue("uclSupabaseUrl", "UCL_SUPABASE_URL")
val productionSupabaseAnonKey = configuredValue("uclSupabaseAnonKey", "UCL_SUPABASE_ANON_KEY")
val configuredVersionCode = configuredValue("uclVersionCode", "UCL_ANDROID_VERSION_CODE").ifBlank { "1" }.toIntOrNull()
    ?.takeIf { it > 0 } ?: throw GradleException("UCL Android version code must be a positive integer.")
val configuredVersionName = configuredValue("uclVersionName", "UCL_ANDROID_VERSION_NAME").ifBlank { "1.0.0" }

val releaseSigningValues = mapOf(
    "storeFile" to System.getenv("EFC_RELEASE_STORE_FILE").orEmpty().trim(),
    "storePassword" to System.getenv("EFC_RELEASE_STORE_PASSWORD").orEmpty(),
    "keyAlias" to System.getenv("EFC_RELEASE_KEY_ALIAS").orEmpty().trim(),
    "keyPassword" to System.getenv("EFC_RELEASE_KEY_PASSWORD").orEmpty(),
)
val hasReleaseSigning = releaseSigningValues.values.all(String::isNotBlank)
val anyReleaseSigning = releaseSigningValues.values.any(String::isNotBlank)
providers.gradleProperty("uclNativeAppBuildDirectory")
    .orNull
    ?.trim()
    ?.takeIf(String::isNotEmpty)
    ?.let { layout.buildDirectory.set(file(it)) }

if (anyReleaseSigning && !hasReleaseSigning) {
    throw GradleException(
        "Incomplete release signing environment. Set EFC_RELEASE_STORE_FILE, " +
            "EFC_RELEASE_STORE_PASSWORD, EFC_RELEASE_KEY_ALIAS, and EFC_RELEASE_KEY_PASSWORD."
    )
}

android {
    namespace = "com.pro.uclfootball"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.pro.uclfootball"
        minSdk = 24
        targetSdk = 37
        versionCode = configuredVersionCode
        versionName = configuredVersionName
    }

    flavorDimensions += "environment"
    productFlavors {
        create("development") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            manifestPlaceholders["appLabel"] = "ucl Dev"
            manifestPlaceholders["authScheme"] = "com.pro.uclfootball.dev"
            buildConfigField("String", "API_BASE_URL", developmentApiBaseUrl.asJavaStringLiteral())
            buildConfigField("String", "SUPABASE_URL", developmentSupabaseUrl.asJavaStringLiteral())
            buildConfigField("String", "SUPABASE_ANON_KEY", developmentSupabaseAnonKey.asJavaStringLiteral())
            buildConfigField("String", "AUTH_REDIRECT_URI", "\"com.pro.uclfootball.dev://auth/callback\"")
            buildConfigField("String", "CURRENCY_LABEL", "\"MMK\"")
            buildConfigField("String", "FIREBASE_APP_ID", configuredValue("uclDevFirebaseAppId", "UCL_DEV_FIREBASE_APP_ID").asJavaStringLiteral())
            buildConfigField("String", "FIREBASE_API_KEY", configuredValue("uclDevFirebaseApiKey", "UCL_DEV_FIREBASE_API_KEY").asJavaStringLiteral())
            buildConfigField("String", "FIREBASE_PROJECT_ID", configuredValue("uclDevFirebaseProjectId", "UCL_DEV_FIREBASE_PROJECT_ID").asJavaStringLiteral())
            buildConfigField("String", "FIREBASE_SENDER_ID", configuredValue("uclDevFirebaseSenderId", "UCL_DEV_FIREBASE_SENDER_ID").asJavaStringLiteral())
        }
        create("production") {
            dimension = "environment"
            manifestPlaceholders["appLabel"] = "ucl"
            manifestPlaceholders["authScheme"] = "com.pro.uclfootball"
            buildConfigField("String", "API_BASE_URL", productionApiBaseUrl.asJavaStringLiteral())
            buildConfigField("String", "SUPABASE_URL", productionSupabaseUrl.asJavaStringLiteral())
            buildConfigField("String", "SUPABASE_ANON_KEY", productionSupabaseAnonKey.asJavaStringLiteral())
            buildConfigField("String", "AUTH_REDIRECT_URI", "\"com.pro.uclfootball://auth/callback\"")
            buildConfigField("String", "CURRENCY_LABEL", "\"MMK\"")
            buildConfigField("String", "FIREBASE_APP_ID", configuredValue("uclFirebaseAppId", "UCL_FIREBASE_APP_ID").asJavaStringLiteral())
            buildConfigField("String", "FIREBASE_API_KEY", configuredValue("uclFirebaseApiKey", "UCL_FIREBASE_API_KEY").asJavaStringLiteral())
            buildConfigField("String", "FIREBASE_PROJECT_ID", configuredValue("uclFirebaseProjectId", "UCL_FIREBASE_PROJECT_ID").asJavaStringLiteral())
            buildConfigField("String", "FIREBASE_SENDER_ID", configuredValue("uclFirebaseSenderId", "UCL_FIREBASE_SENDER_ID").asJavaStringLiteral())
        }
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("protectedRelease") {
                storeFile = file(releaseSigningValues.getValue("storeFile"))
                storePassword = releaseSigningValues.getValue("storePassword")
                keyAlias = releaseSigningValues.getValue("keyAlias")
                keyPassword = releaseSigningValues.getValue("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
        }
        release {
            isMinifyEnabled = providers.gradleProperty("uclMinifyRelease")
                .orElse("false").get().toBooleanStrict()
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("protectedRelease")
        }
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:35.0.0"))
    implementation("com.google.firebase:firebase-messaging")
    val composeBom = platform("androidx.compose:compose-bom:2026.09.00")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.11.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.11.0")
    implementation("androidx.navigation:navigation-compose:2.9.8")
    implementation("com.squareup.okhttp3:okhttp:5.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.11.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
}

tasks.configureEach {
    if (name == "preProductionReleaseBuild") {
        doFirst {
            val missingConfiguration = buildList {
                if (productionApiBaseUrl.isBlank()) add("uclApiBaseUrl / UCL_API_BASE_URL")
                if (productionSupabaseUrl.isBlank()) add("uclSupabaseUrl / UCL_SUPABASE_URL")
                if (productionSupabaseAnonKey.isBlank()) add("uclSupabaseAnonKey / UCL_SUPABASE_ANON_KEY")
                if (!hasReleaseSigning) add("protected EFC_RELEASE_* signing inputs")
                if (configuredValue("uclFirebaseAppId", "UCL_FIREBASE_APP_ID").isBlank() ||
                    configuredValue("uclFirebaseApiKey", "UCL_FIREBASE_API_KEY").isBlank() ||
                    configuredValue("uclFirebaseProjectId", "UCL_FIREBASE_PROJECT_ID").isBlank() ||
                    configuredValue("uclFirebaseSenderId", "UCL_FIREBASE_SENDER_ID").isBlank()) add("production Firebase Android app configuration")
            }
            if (missingConfiguration.isNotEmpty()) {
                throw GradleException(
                    "Production APK is blocked until these protected build inputs are configured: " +
                        missingConfiguration.joinToString(", ")
                )
            }
            val apiUri = runCatching { URI(productionApiBaseUrl) }.getOrNull()
            val supabaseUri = runCatching { URI(productionSupabaseUrl) }.getOrNull()
            if (apiUri?.scheme != "https" || supabaseUri?.scheme != "https") {
                throw GradleException("Production API and Supabase URLs must use HTTPS.")
            }
            if (!file(releaseSigningValues.getValue("storeFile")).isFile) {
                throw GradleException("The protected release keystore file does not exist.")
            }
            val firebaseAppId = configuredValue("uclFirebaseAppId", "UCL_FIREBASE_APP_ID")
            val firebaseSenderId = configuredValue("uclFirebaseSenderId", "UCL_FIREBASE_SENDER_ID")
            if (!firebaseAppId.matches(Regex("1:[0-9]+:android:[a-f0-9]+")) ||
                !firebaseAppId.startsWith("1:$firebaseSenderId:android:")) {
                throw GradleException("Production Firebase configuration must belong to the registered Android app and sender.")
            }
        }
    }
}
