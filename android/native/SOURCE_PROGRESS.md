# Native customer source progress

The user requested that all customer-page code be written before further APK builds or error checks. The follow-up request to finish starts compilation and error fixes after that source pass. This document records source coverage, not completed parity or release approval. Build results are recorded below when available.

## Customer pages

| Website page | Native source |
| --- | --- |
| `/login` | Existing `MainActivity` sign-in screen and auth/session repositories |
| `/register/[[...id]]` | `auth/RegistrationScreen`, `RegistrationViewModel`, `RegistrationRepository`; username check, consent, referral prefill, Auth signup, confirmation continuation, identity-bound profile request |
| `/passwordreset` | Existing `auth/PasswordRecoveryScreen` and ViewModel |
| `/privacy`, `/terms` | Existing `legal/LegalScreen` |
| `/user/faq` | Existing `help/FaqScreen` |
| `/user` | Existing `home/DashboardScreen` |
| `/user/matches` | `match/MatchesScreen`; separate 50-fixture page matching the website query limit |
| `/user/match/[id]` | Existing detail extended to select a score market; `bets/BetSlipScreen` adds stake, server quote, confirmation, result, and uncertain-response handling |
| `/user/bets`, `/user/viewbet/[id]` | Existing history and detail screens |
| `/user/fund` | `payments/PaymentScreens`: method selection |
| `/user/fund/amount` | Native amount step and server conversion quote |
| `/user/fund/payment` | Native destination selection, copy action, and transfer confirmation |
| `/user/fund/receipt` | Android photo picker/camera, bounded image read and preview, authenticated upload request and deposit submission |
| `/user/depositsuccess` | Native deposit request success state; approval remains distinct from crediting funds |
| `/user/bindwallet` | Native payout method/address/account-holder/bank form |
| `/user/withdraw` | Native wallet selection, server limits, eligibility, server fee quote, review, and PIN submission |
| `/user/withdrawsuccess` | Native withdrawal request success state and history link |
| `/user/history` | Existing read-only transaction history |
| `/user/account` | Existing profile plus direct deposit/withdrawal, wallet/PIN and support navigation |
| `/user/refferal` | Existing referral history plus native share sheet for invitation code |
| `/user/vip`, `/user/wheel` | Existing server-backed VIP and wheel screens |
| `/user/codesetting` | Native four-digit PIN/confirmation form; existing PIN routes to support instead of permitting an unsupported self-service change |
| Account support/community links | `help/SupportScreen` reads platform settings and opens valid HTTPS links in development only |

Deposit steps and success states share a `PaymentViewModel` inside each native payment journey. Secrets and receipt bytes are held in memory, not saved in Bundle state. After process death the user must refresh the server and reselect a receipt; the app does not invent a successful submission. The accepted referral URI is `{environment auth scheme}://register/{numeric code}`. It works for an installed app; universal web referral links and approved sharing domains remain launch inputs.

## API source added

- `GET /api/mobile/deposit-quote`: authenticated server conversion using existing payment-rate helpers and deposit minimum.
- `GET /api/mobile/withdrawal-quote`: authenticated fee/total quote using the database's exact numeric rounding. Submission checks the current fee, limits, destination and balance in the withdrawal transaction.
- `GET /api/mobile/bet-quote`: authenticated server quote using database VIP level/bonus helpers; placement checks the confirmed odd atomically. Disabled unless `UCL_NATIVE_BETTING_ENABLED=true`.
- `POST /api/mobile/signup-profile`: verifies the Auth user and confirmed email, derives identity from that user, and invokes atomic native profile/referral provisioning. Disabled unless `UCL_NATIVE_REGISTRATION_ENABLED=true`.
- `POST /api/mobile/upload-receipt`: authenticates the profile, caps image data at 8 MB, checks JPEG/PNG/WebP signatures, and scopes the object path to the authenticated user. Disabled unless `UCL_NATIVE_RECEIPT_UPLOAD_ENABLED=true`. It currently uses the existing public receipt bucket; visibility/retention approval remains required.
- `/api/mobile/payment-data`: returned method, destination, wallet, and settings fields are now allowlisted; withdrawal exemption usernames are omitted. No database grants, RLS, or bucket settings were changed.

## Activation and later checks

`network/NativeJourneyGates` holds registration, payments, PIN and betting disabled while their documented integration gates remain unresolved. Their forms, repositories, request models, validation and response states are written. UI submission does not fake success when a gate is disabled. Production wheel spins stay disabled independently of the MMK display label.

Native profile/referral provisioning, PIN hashing/throttling, bet retry handling and withdrawal validation now have server implementations, as recorded below. The legacy public signup handler, existing direct financial RPC exposure, old-app shutdown, market eligibility, approved payment rails/destinations, signing backup/rotation and deployed integration checks remain open. No Capacitor removal or production cutover has occurred.

## Device and distribution source

- Firebase Messaging service, programmatic Android Firebase options, Android 13+ permission request after sign-in, token registration/refresh/foreground retry, logout unregistration/token deletion, and private notification channel/icon are written.
- Native tokens use `android-native`. The accompanying server sender change sends data-only wakeups for these tokens. Delivery displays generic localized account activity only when a local session and notification permission exist, then opens the authenticated feed. The feed handles allowlisted destination navigation. Existing token platforms retain their existing payloads.
- The `push_tokens` language constraint now accepts Burmese (`my`) while retaining legacy language values. Migration `native_push_burmese_language` was applied on 2026-10-10 and its validated live constraint was read back. No RLS or grants changed in that migration. Do not execute the entire base schema merely to update this constraint.
- `GET /api/mobile/release` supplies a deployment-owned signed-APK manifest. Production update prompts validate app identity, increasing version, HTTPS API origin and checksum shape. Download and installation are user controlled. Browser downloads are not hashed by the native app; Android enforces same-key updates.
- Configurable release version code/name and `scripts/build-native-release.ps1` prepare a protected signed artifact and SHA-256 manifest without publishing. Production release configuration is checked before the build. Android API 24 is now the minimum required by the Firebase SDK.
- Logout resets native sign-in state. Missing/expired auth tokens become HTTP 401 errors for auth-aware navigation. Account, history, fixtures, bets, rewards, notifications and payment flows refresh on returning to retained screens. Leaving a bet review invalidates its quote.

## Checks and outstanding execution

After the user's integration approval, the existing API and public Supabase inputs were configured outside the repository. Firebase Android app `com.pro.uclfootball` was registered in the existing `atalanta-77824` project with app ID `1:99712962887:android:571c791d90018242077c62`. Its existing Android public API key was retrieved from Google Cloud; key restrictions were not changed. A new release key was generated outside Git with Windows user protected credentials. The production signed integration APK built successfully; the intended `/downloads/ucl-1.0.0-1.apk` URL is staging metadata and is not published.

Migration `native_atomic_profile_provisioning` adds a server-only, invoker function that checks the confirmed Auth identity, creates profile and referral records atomically, and repairs a missing referral record on retry. Catalog checks confirm `anon` and `authenticated` cannot execute it and `service_role` can. A nonexistent identity was rejected before profile creation; no customer registration or account mutation was performed. The corresponding API source now uses this function, but its website deployment remains pending. The legacy website signup endpoint has not been changed. RLS remains unchanged.

The optimized release compile passed, but Compose mapping dependency resolution failed on JVM TLS and R8 optimization was stopped. The optional Maven Central fallback has now downloaded the pinned mapping tool, Kotlin runtime and ASM dependencies and verified their published checksums. The first signed integration build runs with optional code shrinking off to finish packaging. Browser console control subsequently timed out repeatedly; Firebase registration is verified in the earlier console state, but its screenshot and release certificate fingerprint entry remain pending. No Android device is attached. Website deployment access has been requested.

### Signed integration artifact — 2026-10-10

- `artifacts/native/ucl-1.0.0-1.apk` (11,088,495 bytes), application ID `com.pro.uclfootball`, version code 1, version name `1.0.0`, minimum SDK 24.
- APK SHA-256: `d2b8c84b106964ec6decd1be20a7c46005e52f83b74f807e00e35a71df638ac9`.
- `apksigner verify --print-certs` passed and the signing certificate matches the new protected keystore: SHA-256 `fd27b94a427fe25b651606dde0a952b843c83a323049ddafc170870c9a2b4778`.
- `artifacts/native/release-1.json` records the intended URL/version/checksum. The APK and manifest are local, ignored artifacts; neither is published.
- Gradle completed `assembleProductionRelease`, including release lint, successfully with code shrinking off. No installation or runtime/device test has been performed; no emulator AVD is configured.
- Registration, payments, PIN, betting and production wheel mutations remain disabled. Server deployment, verification of PIN protections and financial authorization/idempotency, visual parity, runtime checks and old-app shutdown remain required before complete replacement. This APK is for integration review, not a completed launch.
- Domain CNAME points to Vercel, and the successful GitHub deployment status identifies `jeremiahxs-projects/afc`. Supabase access is already working; deployment needs that Vercel project's access.

Both current debug flavors compiled and packaged successfully on 2026-10-10. The final command was `gradlew.bat --console=plain --offline --max-workers=2 --stacktrace assembleDevelopmentDebug assembleProductionDebug`; Gradle reported `BUILD SUCCESSFUL in 1m 16s` after cached compilation. Artifacts:

- `app/build/outputs/apk/development/debug/app-development-debug.apk`
- `app/build/outputs/apk/production/debug/app-production-debug.apk`

These use debug signing and are not signed production releases. The initial source compile had excluded a refresh helper added during the running build; the finalized source compiled on the next build. APK packaging then failed once without a cause in the console and succeeded on the cached retry with stack traces enabled. No lasting packaging cause was proven. Firebase legacy-token API deprecation warnings and an unstripped Datastore native library warning remain; the legacy-token mode deliberately matches the existing server registration contract.

`apksigner verify` passed for both final debug APKs. Their generated metadata confirms application IDs `com.pro.uclfootball.dev.debug` and `com.pro.uclfootball.debug`, and minimum SDK 24. Final SHA-256 hashes:

- Development: `C97B2C4A9DD45ECD7556C2C29B18BE0C124CB41A253FA12D96F94CEA739551AC`
- Production flavor (debug signing): `E7960B98202619C80DCEEEBCCD15EB57056756F5AC46F210095C15D88A2D0FCD`

JavaScript syntax checks passed for all eight added/changed API and sender files. Package JSON and the release PowerShell script passed syntax checks. `git diff --check` passed with line-ending warnings. These checks do not exercise a deployed backend or device behavior.

The debug artifacts above predate service configuration and Firebase registration; the signed integration artifact uses the configured production API, public Supabase and Android Firebase inputs. No live financial action, Auth signup/recovery round trip, Storage upload, push send, device installation or cutover was performed. Registration/payments/PIN/betting activation remains disabled, and production wheel spins remain disabled. Required API/device/screenshot and cutover checks remain outstanding.

## Server transaction work — 2026-10-10

- Applied `native_bet_quote_and_retry_contract` and `native_bet_legacy_search_path`. Native quote math uses existing database market/VIP rules. A UUID replay is checked against the original owner, match, stake, market and odd before current eligibility checks, so a completed retry does not deduct again. The API selects this function when a client bet UUID is supplied.
- Applied `server_transaction_pin_controls`. New PINs and admin resets use salted scrypt with a server-only pepper. Existing four-digit PINs migrate after successful verification. A private counter enforces five verification attempts per 15-minute window across server instances. PIN snapshots are checked again before withdrawal; admin profile responses omit PIN values.
- Applied `verified_withdrawal_wallet_and_pin` and `verified_withdrawal_minimum_snapshot`. Withdrawal submission resolves a wallet owned by the authenticated profile and an available matching method. The transaction rechecks PIN, destination, method rate, minimum, current fee, pending requests and five-bet eligibility before delegating the existing atomic debit and limits.
- New functions deny execution to `anon` and `authenticated` and permit `service_role`. The private PIN counter denies client schema/table access. Existing RLS settings, legacy RPC grants and Storage settings remain unchanged.
- Catalog readback confirms the withdrawal minimum guard and server-only function grants. Missing-identity checks previously rejected native registration, betting and PIN attempts without creating customer records. No successful money action or live PIN mutation was exercised.
- Next.js changes remain local. Before deployment, securely load `TRANSACTION_PIN_PEPPER` into the Vercel server environment and preserve a backup. Its protected local copy is outside Git at `%LOCALAPPDATA%/UclNative/server-secrets/transaction-pin.xml`; `scripts/load-server-pin-secret.ps1` loads it only into the current server process. Missing pepper returns 503 for PIN services. Never pass it to Android or expose it as a public environment variable.
- Withdrawal submission still needs a persisted request UUID and a comparison against the user's reviewed total before activation. Receipt privacy/retention, legacy direct access, device checks and coordinated old-app shutdown remain launch gates.
