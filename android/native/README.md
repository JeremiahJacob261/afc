# Native Android project

This standalone Kotlin + Compose project is being developed alongside the existing Capacitor project in `../`. Keeping the legacy module intact preserves a rollback path while parity and cutover gates remain open. The legacy module is removed only after native parity is approved.

## Build variants

- `developmentDebug` is an isolated install (`com.pro.uclfootball.dev.debug`).
- `productionRelease` uses `com.pro.uclfootball` and refuses to assemble unless HTTPS API/Supabase endpoints, the public Supabase anon key, and protected release-signing environment variables are supplied.
- Build inputs may be passed as Gradle properties or environment variables. Do not commit endpoint credentials or signing secrets. The Supabase anon key is a public client key, not a service-role key; production use remains gated on the approved no-RLS grant/API controls.

Use `gradlew.bat assembleDevelopmentDebug assembleProductionDebug` from this directory to compile both debug variants. The customer journeys and their remaining activation gates are listed in [SOURCE_PROGRESS.md](SOURCE_PROGRESS.md). Debug APKs use debug signing and are development artifacts. Screen capture, live API/device verification and cutover approval remain required. Android 7.0 (API 24) is the minimum supported version for the current Firebase SDK.

`-PuclNativeAppBuildDirectory=<path>` redirects generated app files when disk space is constrained. Set `uclVersionCode` / `UCL_ANDROID_VERSION_CODE` and `uclVersionName` / `UCL_ANDROID_VERSION_NAME` for releases; every upgrade must have a greater version code and use the same signing key.

## Push configuration

Register the exact package ID of each flavor/build type in the approved Firebase project. Supply Firebase Android app options through Gradle properties or environment variables:

| Development property | Development environment | Production property | Production environment |
| --- | --- | --- | --- |
| `uclDevFirebaseAppId` | `UCL_DEV_FIREBASE_APP_ID` | `uclFirebaseAppId` | `UCL_FIREBASE_APP_ID` |
| `uclDevFirebaseApiKey` | `UCL_DEV_FIREBASE_API_KEY` | `uclFirebaseApiKey` | `UCL_FIREBASE_API_KEY` |
| `uclDevFirebaseProjectId` | `UCL_DEV_FIREBASE_PROJECT_ID` | `uclFirebaseProjectId` | `UCL_FIREBASE_PROJECT_ID` |
| `uclDevFirebaseSenderId` | `UCL_DEV_FIREBASE_SENDER_ID` | `uclFirebaseSenderId` | `UCL_FIREBASE_SENDER_ID` |

These are the Android client values from the registered app's Firebase configuration, never Firebase Admin service credentials. The app initializes Firebase from these options. Push token auto-initialization starts only after sign-in and notification permission. Token registration retries on foreground and token refresh. Logout attempts server unregistration and local token deletion before clearing the session. Offline server revocation still needs device verification.

Deploy the accompanying `lib/pushNotifications.js` change with the app. Native tokens register as `android-native`; the server sends data-only notification wakeups for these tokens, and the service checks the local session and notification permission before posting. It shows localized generic account activity and opens the authenticated notification feed, where allowlisted destinations are resolved from server data. Existing web/Capacitor token payloads retain their existing behavior. Channel `efc_updates` matches the current server channel contract.

## Direct APK updates

`GET /api/mobile/release` reads deployment-owned `UCL_ANDROID_VERSION_CODE`, `UCL_ANDROID_VERSION_NAME`, `UCL_ANDROID_APK_URL`, `UCL_ANDROID_RELEASE_ORIGIN`, and `UCL_ANDROID_APK_SHA256`. The URL must be an HTTPS `.apk` on the API origin. The endpoint returns version zero until all manifest inputs are valid. The production client checks the application ID, increasing version, origin and checksum format before offering a download; the browser handles downloading and Android owns installation. The client does not hash browser downloads. Android's package installer enforces the existing installed app's signing identity on upgrades; installation and same-key upgrade verification are still pending.

Produce the signed artifact using `gradlew.bat assembleProductionRelease` with protected signing, API/Auth, and Firebase inputs. Production checks run before release build work begins. Publishing the APK/manifest and retiring the old app are separate cutover actions governed by the port plan.

From the repository root, `scripts/build-native-release.ps1 -VersionCode <number> -VersionName <x.y.z> -DownloadUrl <https APK URL>` builds with protected environment inputs and prepares the APK and SHA-256 manifest under `artifacts/native/`. It does not publish them. That directory should remain local or in protected release storage.

## Configuration on this workstation

The approved existing API is `https://www.europeanfc01.com`; Supabase is `pctajnbqkposgymgbqkc.supabase.co`. Production Firebase Android app `com.pro.uclfootball` is registered in `atalanta-77824`. Public build inputs are stored outside Git at `%LOCALAPPDATA%/UclNative/build-inputs.json`. Development currently uses the existing API/Auth service for read-only integration; development push is not configured until its separate package is registered.

`scripts/configure-native-services.ps1` reads only the two public Supabase inputs from the existing environment file and writes those Android inputs. It never copies the service-role key. Dot-source `scripts/load-native-build-inputs.ps1` before invoking Gradle in a PowerShell process; the release helper loads this workstation configuration automatically when inputs are absent.

`scripts/initialize-native-signing.ps1` creates a new RSA 3072 signing key for this new package and preserves it on subsequent runs. The key is `%LOCALAPPDATA%/UclNative/signing/ucl-release.p12`; its credentials are stored beside it using Windows user protection and restricted directory permissions. The credentials file can only be decrypted by the creating Windows user on this machine. Back up the keystore and export its password to an approved password manager before distributing the app. Losing this key prevents same-package APK updates. An unrelated project's signing key has not been reused.

On machines with PowerShell scripts disabled, run the repository helper using `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-native-release.ps1 ...`; this applies only to that process.

`npm run android:native:debug` loads this workstation's configured inputs before building both debug variants. `npm run android:native:release -- -VersionCode 1 -VersionName 1.0.0 -DownloadUrl <url>` loads the protected inputs and stages a signed APK without publishing it.

If the JVM cannot download the release Compose mapping dependency over TLS, `scripts/stage-native-compose-dependencies.ps1` downloads the pinned mapping tool and dependencies directly from Maven Central and checks every published checksum. Pass its local repository path as `-DependencyRepository <path>` to the release helper. Normal builds continue to use the official repositories; this fallback does not disable TLS verification or replace dependencies with other versions.

Release code shrinking is optional and defaults off for the first integration artifact. Use `-EnableMinification` with the helper (or `-PuclMinifyRelease=true` with Gradle) for optimized releases. Signing, production configuration checks, application identity, and journey gates apply in either mode.

Implementation references: [Firebase Android setup](https://firebase.google.com/docs/android/setup), [FCM Android setup](https://firebase.google.com/docs/cloud-messaging/android/get-started).
