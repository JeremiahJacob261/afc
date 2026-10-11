# Offline customer data

The production Android app restores its encrypted local session without calling
`api/me` or refreshing a token. Access-token expiry affects online requests, not
access to previously saved pages. First sign-in still requires a connection.

Customer snapshots are AES-GCM encrypted with an Android Keystore key and saved
under `filesDir/customer-snapshots`, separate from disposable public image cache.
Each snapshot identifies its account, endpoint, schema version and save time.
Profile snapshots are retained; other snapshots share a 20 MiB oldest-first
limit. Android backup is disabled. Logout/account changes clear private snapshots
and reject late responses. Invalid ciphertext/schema is discarded.

Read pages hydrate saved content first, then refresh in the background. Dashboard
reads are reused within each foreground session; explicit refresh fetches again.
Other pages refresh when opened or resumed, sharing overlapping requests. Saved
financial content shows its last update time. A failed refresh leaves content
visible. Only data already fetched can be shown offline; the cache is not a full
account export or a complete historic archive.

Cached endpoints include profile/VIP, bets and viewed bet details, transaction
history, notifications, referrals, wheel state and payment information. Fixtures,
viewed match details and platform settings use a separate public namespace.
Only known decoded response fields are persisted. Passwords, transaction PINs,
receipt uploads and quotes are excluded. The existing bounded image cache is
unchanged; Android may reclaim images from disposable cache storage.

Bets, payments and wheel spins always call the server. There is no offline action
queue. Reading a previous wheel award never replays its celebration; recovery
after an uncertain spin requires a fresh server response. A revoked session ends
local login when discovered by an online request; network errors and ordinary
404 records do not. No server API or database migration is required.

Release 1.0.2 (code 3) uses package `com.pro.uclfootball` and the existing release
certificate. It upgrades the previous signed production release. Debug packages
are separate Android applications, so their login/cache data does not transfer.
APK and release metadata are delivered locally; publication is a separate step.

## Verification (2026-10-10)

All 30 shared-code unit tests passed, including 14 tests added for snapshots,
offline session restoration, stale responses and wheel restoration. Production
release lint completed with 0 errors (306 project warnings). Customer
asset checks passed for both languages, fonts, images and referenced icons.
There was no connected Android device or configured emulator, so physical-device
startup, upgrade and visual checks remain unverified.

The build uses `testDevelopmentDebugUnitTest` for shared Kotlin behavior (the
project has no release unit-test task), followed by `lintProductionRelease` and
`assembleProductionRelease`, with version code 3 and version name 1.0.2. Protected
build inputs are loaded through `scripts/load-native-build-inputs.ps1`; credentials
are not recorded in this document.

The final APK manifest and signature were verified: `com.pro.uclfootball`, code
3, version 1.0.2, not debuggable, and certificate matching production release
1.0.1. Delivery includes the APK, `release-3.json` and an APK `.sha256` file under
`artifacts/native`. The metadata download URL is reserved for later publication;
neither the APK nor the update feed was published by this change.
