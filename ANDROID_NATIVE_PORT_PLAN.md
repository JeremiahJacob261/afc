# Native Android port plan — ucl

## Agreed scope

- Build a new **Kotlin + Jetpack Compose** Android app with application ID `com.pro.uclfootball` and display name `ucl`.
- Reproduce the **website's mobile layouts screen for screen**, including their flows and content. Implement screens with native UI, not a WebView.
- Include all working customer features plus authentication, help, privacy, and terms. **Exclude the landing page and the admin console.** The admin console stays on the web.
- Reuse the existing Next.js API, Supabase service layer, and server-owned financial and betting rules. Users sign in to the new app.
- Distribute signed APKs directly. Launch as one complete replacement, then remove Capacitor and Capgo from the repository. No partial native release.
- Show an offline state with retry; require fresh server data for balances, bets, deposits, and withdrawals.
- The previous `com.efcfootball.app` app must stop working at cutover. The new package is a separate installation and cannot update it in place.

## Product and backend facts that shape the work

- The current `android/` app is a Capacitor shell (`MainActivity.java` extends `BridgeActivity`; Gradle references Capacitor and Cordova modules).
- The separate `mobile/` React app covers many customer flows, but the website's mobile layouts are the visual source. Use `mobile/` only to understand existing behavior and API calls.
- The current service layer has MMK ledger and payment assumptions, five configured languages, and a default `+1` phone country code. These are **not validated for the new market**.
- Installed old APKs call the shared Next API and Supabase directly. Removing Capacitor source, removing an update manifest, or checking a client header cannot reliably disable those APKs.
- `package.json` contains release signing credentials in a build command. Remove the embedded credentials, use protected signing inputs, and treat the exposed values as needing rotation if valid. Do not copy them into the native project or documentation.
- The repository has pre-existing uncommitted changes. Preserve them when implementation begins.

## Delivery sequence

### 1. Freeze the parity contract

1. Capture each in-scope website mobile screen and its loading, empty, error, success, and narrow-screen states. Record navigation, form validation, copy, and localization keys.
2. Trace every customer action to its API, Supabase Auth/Storage operation, or external link. Define request/response contracts and financial invariants before coding clients.
3. Confirm launch-market values from product and operations: country eligibility, account/data boundary, currency and ledger, payment methods and destinations, languages, support links, legal text, and customer website availability. Keep current values only in development until these are validated.
4. Define a server-enforced old-app shutdown that also accounts for direct Supabase access. If the old and new clients cannot be distinguished securely on shared services, isolate the new market's backend or migrate/retire the old endpoints and credentials. Do not call the cutover complete while an installed old APK can still authenticate or transact.

### 2. Establish a native Android foundation

1. Replace the Capacitor Android module with a native Kotlin/Compose project under `android/`, retaining only useful brand assets after review. Set `applicationId` and namespace to `com.pro.uclfootball`; start a new version sequence.
2. Build a native design system from the website's mobile screens: typography, colors, spacing, icons, components, bottom navigation, sheets, dialogs, and status/navigation bar behavior. Check small screens, font scaling, and accessibility.
3. Add typed API models, an authenticated network client, repositories, ViewModels, navigation, and consistent loading/error/retry states. Keep betting and money calculations authoritative on the server.
4. Implement Supabase sign-in, token refresh, sign-out, protected session storage, and auth-aware navigation. New users and existing users sign in; no old WebView session migration.
5. Set up build variants/configuration for development and production without embedding server secrets or signing passwords in source.

### 3. Port all customer journeys

| Journey | Website mobile source | Native acceptance target |
| --- | --- | --- |
| Entry and account | `/login`, `/register/[[...id]]`, `/passwordreset` | Sign in, sign up, referral link prefill, password reset and callback, sign out |
| Legal and help | `/privacy`, `/terms`, `/user/faq` | Full native content, links, consent, help and support actions |
| Football and betting | `/user`, `/user/matches`, `/user/match/[id]`, `/user/bets`, `/user/viewbet/[id]` | Browse live and prematch markets, place a bet, show authoritative balance and results, inspect history |
| Deposits | `/user/fund` and its amount/payment/receipt steps, `/user/depositsuccess` | Method, rate, amount, destination, image capture/picker, authenticated receipt upload, submission, status and success |
| Withdrawals and wallet | `/user/bindwallet`, `/user/withdraw`, `/user/withdrawsuccess`, `/user/history` | Bind payout destination, PIN/limits, submit withdrawal, track transactions and status |
| Account and rewards | `/user/account`, `/user/refferal`, `/user/vip`, `/user/wheel`, `/user/codesetting` | Profile, referrals, VIP, wheel eligibility/spin/reward, PIN setup/change |
| Notifications | `/user/notification` | List, unread state, tap navigation, and device push registration/delivery |

Web redirect aliases for deposit (`/user/deposit`, `/user/address`, `/user/inputvalue`, `/user/transaction`) do not need separate native screens. `/reg` and `/newReg` are prototype/test pages, not functioning registration flows. The landing page and all `/admin` routes are out of app scope.

### 4. Replace device and distribution integrations

1. Register `com.pro.uclfootball` in the required Firebase project and configure native Firebase Cloud Messaging. Connect token registration/unregistration to the existing notification API; handle token refresh, permission, foreground/background delivery, and tap navigation.
2. Implement Android app links or explicit deep-link handling for referral registration, password reset, and notification destinations. Keep the accepted URL contract documented.
3. Use Android's image picker/camera and safe upload handling for deposit receipts; verify size, type, failure, retry, and Storage permissions.
4. Replace Capgo bundle updates with signed APK releases. Provide a version endpoint or release manifest, an in-app update prompt, a trusted download location, and user-controlled installation. Verify that an installed `ucl` APK upgrades to a later signed `ucl` APK.
5. Produce reproducible, signed release APKs in a protected build process. Remove the inline signing credentials from `package.json` and rotate them if they were ever used.

### 5. Validate the complete cutover

1. Compare every native screen against the website's mobile layout and copy. Verify all five currently configured locales where offered, accessibility, offline/error states, and supported screen sizes.
2. Run end-to-end tests on the critical journeys: referral registration and sign-in; market to bet to settlement/history; deposit with receipt; wallet/PIN/withdrawal; wheel/rewards; push delivery and navigation; legal consent and password reset.
3. Verify server-side authorization, idempotency, and balance invariants for each money and betting action. Test denied, expired, and refreshed sessions.
4. Test new APK installation and upgrades, clean install, process death, low network, notification permission denial, receipt upload failures, and logout.
5. Prove that an already installed old Capacitor APK can no longer authenticate, read protected data, receive operational updates, or transact. Also prove that the new app and the retained admin web console work after the shutdown. This is a **release gate**, not a cleanup task.

### 6. Remove Capacitor after native parity is signed off

- Delete the Capacitor shell, `capacitor.config.ts`, generated Cordova modules and Gradle wiring, Capacitor/Capgo packages and scripts, the React/Vite `mobile/` bundle if it has no remaining use, OTA packaging code and manifests, and Capacitor-specific CORS/origin allowances.
- Remove obsolete splash/push code, documentation, and CI jobs; update `README.md` and `PRODUCT.md` to describe the native app and direct APK release process.
- Preserve the Next.js website, admin console, shared API, database migrations, and product assets that remain in use.
- Check the dependency lockfile, build a release APK, and verify no runtime or build dependency on Capacitor remains.

## Definition of done

- All in-scope website mobile journeys are present and visually reviewed in native Compose; the landing page and admin console are absent from the APK.
- The new app ID is `com.pro.uclfootball`, display name is `ucl`, and a signed direct APK installs and upgrades successfully.
- Authentication, payments, betting, rewards, receipt upload, notifications, legal content, and offline/error states pass the cutover checks.
- Installed old APKs cannot use protected services after launch; the new app and admin console still work.
- The repository and release pipeline have no Capacitor/Capgo dependency or embedded signing credential.

## Release inputs still required

These are launch gates, not assumptions to fill with the old market's defaults: target countries, settlement currency and payment rails, account/data separation or migration, approved legal text and eligibility rules, language set, customer web availability, support destinations, and the exact backend shutdown mechanism for old installed APKs. Implementation can start on screen and API parity while these are settled; production cutover cannot.
