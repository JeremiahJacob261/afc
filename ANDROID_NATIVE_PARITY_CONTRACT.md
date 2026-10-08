# Native Android parity contract

Status: **draft, step 1 not frozen**. This records repository evidence and blocks assumptions. It is the working acceptance contract for `ANDROID_NATIVE_PORT_PLAN.md` step 1.

## Scope

- Native Kotlin + Jetpack Compose app, application ID `com.pro.uclfootball`, display name `ucl`.
- Include customer account, football/betting, deposit/withdrawal, rewards, notifications, help, privacy, and terms journeys.
- Exclude the landing page and admin console from the APK. Keep the admin console on the website.
- Reuse server-owned rules and services. Do not calculate authoritative balances, bet acceptance, odds, or settlements on-device.
- The plan's financial actions require fresh server data; offline state must prevent stale balance, market, deposit, and withdrawal actions.

## Source route and navigation inventory

The list is from `pages/`; route labels here describe the route's role, not proof that every state has been captured or accepted.

Static localization keys referenced directly by each in-scope page and shared customer components are inventoried in [ANDROID_NATIVE_LOCALE_KEY_MAP.md](ANDROID_NATIVE_LOCALE_KEY_MAP.md). Dynamic translation keys and copy contributed by nested components still require source review.

The route-by-route capture and state checklist is in [ANDROID_NATIVE_SCREEN_CAPTURE_MATRIX.md](ANDROID_NATIVE_SCREEN_CAPTURE_MATRIX.md). It deliberately keeps every uncaptured state pending rather than treating a code inventory as visual sign-off.

| Journey | Website mobile routes | Known transitions / source notes | Capture status |
| --- | --- | --- | --- |
| Entry and account | `/login`, `/register/[[...id]]`, `/passwordreset` | Login links to referral registration and password reset. Registration checks username and submits profile through `/api/check-username` and `/api/signup-profile`. | Public login page observed locally and on configured website. No screenshot retained because the form was prefilled with a personal identifier. Mobile-size and other-state captures remain pending. |
| Legal and help | `/privacy`, `/terms`, `/user/faq` | FAQ is inside the customer area. | Privacy, terms, and collapsed FAQ state observed locally at default viewport; mobile-size and interaction-state captures pending. |
| Football and betting | `/user`, `/user/matches`, `/user/match/[id]`, `/user/bets`, `/user/viewbet/[id]` | Main tabs navigate home, matches, account, and bets. Bet details open from history. Fixture data also reads `bets` through Supabase; account history uses `/api/my-bets`. | Pending. |
| Deposits | `/user/fund`, `/user/fund/amount`, `/user/fund/payment`, `/user/fund/receipt`, `/user/depositsuccess` | `/user/deposit`, `/user/address`, `/user/inputvalue`, and `/user/transaction` redirect to `/user/fund`. | Pending. |
| Withdrawals and wallet | `/user/bindwallet`, `/user/withdraw`, `/user/withdrawsuccess`, `/user/history` | Withdrawal may route to PIN setup or wallet binding before success. | Pending. |
| Account and rewards | `/user/account`, `/user/refferal`, `/user/vip`, `/user/wheel`, `/user/codesetting` | Account links to wallet, PIN, referral, and reward surfaces; PIN uses `/api/set-pin`; wheel uses `/api/wheel-spin`. | Pending. |
| Notifications | `/user/notification` | Customer navigation includes notification access; push registration APIs exist. | Pending. |
| Excluded | `/`, `/admin/**`, `/reg`, `/newReg` | Landing/admin are out of app scope; `/reg` and `/newReg` are prototype/test pages. | Confirmed scope only. |

## API and service trace (repository evidence)

| User action / data | Existing service surface | Contract still to record before client implementation |
| --- | --- | --- |
| Sign in / sign out / password reset | Website login calls `POST /api/login-email` with `{ username }` only when identity has no `@`, then calls `supabase.auth.signInWithPassword({ email, password })`; account signs out through Supabase Auth. Website `/passwordreset` currently calls Firebase `sendPasswordResetEmail`; the separate mobile app calls Supabase `resetPasswordForEmail` with redirect URL `{apiBaseUrl}/login`. | **Auth provider mismatch:** decide and verify the supported reset provider, deep-link/callback URL, token/session exchange, and error copy. Freeze username-to-email response shape (`{status,email}`), session refresh, secure token storage, and sign-out behavior. The native client should follow the plan's Supabase Auth requirement. |
| Registration | UI checks phone length >= 9, required terms/age checkbox, and password equality; it checks username via `POST /api/check-username` with `{ username }`, calls `supabase.auth.signUp({ email, password, options.data: { displayName, phoneNumber } })`, then calls `POST /api/signup-profile` with `{ userid, username, email, phone, countrycode, refer }`. Profile API returns `{ status, newrefer }`; username collision is 409. | Referral URL contract, password rules, email confirmation/session behavior, consent payload, country eligibility/country-code source, profile creation/retry/idempotency, and failure recovery if Auth succeeds but profile creation fails. Existing UI defaults to US and server fallback `+1`; neither is a launch-market decision. |
| Customer profile / platform settings | Authenticated `GET /api/me` returns `{ status, profile, referralCount, vip, currency, membershipBalanceThreshold }`; public `GET /api/platform-settings` returns `{ status, links }`. | Typed response fields, cache policy, profile refresh and unavailable/unauthorized behavior. Platform links currently include customer support and community destinations, but destinations are not approved for the new market. |
| Fixtures / live and prematch markets | Website directly reads Supabase `bets` rows where `verified=false` and future `tsgmt`; `/api/mobile/matches?limit={n}` returns `{ status, matches }` (limit clamped 1-50), `/api/mobile/match?id={id}` returns `{ status, match }`. | Choose one canonical read surface; freeze match/market fields, freshness, pagination, suspension, polling and empty/error behavior. Avoid duplicated market business logic. |
| Bet placement / history / details | Authenticated `POST /api/place-bet` accepts `match_id`, `picked`, `stake`, optional `client_bet_id`, and `expected_odd`; invokes `place_bet_with_expected_odd_atomic`. Authenticated `GET /api/my-bets` returns `{ status, unsettled, settled }`; `GET /api/my-bet?id={id}` returns `{ status, bet, match }`; fixture reads also access Supabase `bets`. | Freeze typed responses, duplicate/idempotency behavior, stake and market constraints, authoritative balance changes, settlement and error invariants. Existing handler enforces a minimum stake of 5000 in the current configured currency; do not carry that market value forward without approval. |
| Deposit methods / request / receipt | Existing `DepositFlow` directly reads `walle` and `depositwallet` via Supabase, and calls authenticated `GET /api/pending-payment-request` returning `{ pending, type }`. Receipt uploads to Storage bucket `trcreceipt` under `public/{uuid}-{filename}`, then `POST /api/create-deposit` with `amount`, `method`, `methodName`, `address` (public receipt URL), `adminaddress`, and `expectedRate`. Success state is kept in `sessionStorage`. | Approved currency/methods; canonical payment-data read surface; Storage authorization/bucket policy and public URL risk; file size/type validation, upload failure/retry, idempotency, pending request lifecycle, rate snapshot, ledger invariants, and process-death behavior. |
| Wallet / withdrawal / transactions | `POST /api/bindwallet` accepts `methodId`, `wallet`, `name`, `bank`; authenticated `GET /api/withdrawal-data` returns profile, wallets, methods, settings, currency, and withdrawal eligibility; `POST /api/withdraw` accepts `pass` (PIN), `wallet`, `amount`, `method`, `bank`, `accountname`; `GET /api/my-transactions?type={type}`. Bind returns `{ status, message }`. Withdrawal returns an array with `status: Success|Failed`; many business failures use HTTP 200 and optional `code`, `retryAt`. | Freeze typed schemas, PIN rules, configured limits/fees, cooldown and pending semantics, idempotency, status and ledger invariants. UI currently contains MMK labels/defaults; server/migrations include USDT-specific caps and rates. Resolve market config before carrying any values. The `withdrawal-data` handler does not include a pending transaction field. |
| Referrals / VIP / rewards | `GET /api/my-referrals` returns `{ status, refer, referrals, membershipBalanceThreshold }`; `/api/me` supplies VIP progress; `/api/wheel-spin` read returns `canSpin`, items, revision, last prize and next eligible time; spin POST sends `{ revision }`. | Eligibility, reward authority, one-time semantics, revision conflict/cooldown behavior, whether `/api/reward` is still used, and response schemas. |
| Notifications | `GET /api/notify` returns a mixed notification array; `?summary=1` returns `{ notifications, unreadCount }`; `POST /api/notify` with `action: "mark-read"` and optional notification IDs updates unread app notifications. Push registration accepts `token`, `platform`, `deviceId`, `language`; language is currently clamped to `en/fr/es/it/ru`. | Typed notification variants, authorization boundaries for every source table, unread semantics, payload schema and destination routing. Current formatter hardcodes MMK in several message types; do not copy those labels for the new market. |

This is an endpoint inventory, **not** a frozen client contract. Request/response schemas and server-side money/betting invariants remain to be traced from handlers, shared auth helpers, and database procedures before client implementation begins.

### Handler-backed request/response details

The following details were verified in the checked-in Next.js handlers. They describe the current repository contract only; they do not approve carrying current-market amounts, text, or payment configuration into the launch app.

| Endpoint | Request | Successful response | Relevant failures / invariants |
| --- | --- | --- | --- |
| `POST /api/login-email` | `{ username }` | `{ status: "success", email }` | Empty username: 400; unknown username: 404 with generic `Invalid login credentials`; endpoint is public and resolves username through service role. |
| `POST /api/check-username` | `{ username }` | `{ status: "success", available: boolean }` | Empty username: 400. This is an availability check, not a reservation; signup rechecks for collision. |
| `POST /api/signup-profile` | `{ userid, username, email, phone?, countrycode?, refer? }` | `{ status: "success", newrefer }`; existing profile returns success with `Profile already exists` and no `newrefer` | `userid`, `username`, `email` required; username collision: 409. `userid` is trusted from request body while this endpoint uses service role and does not verify a matching Auth user in this handler. A referral is applied only if it resolves; otherwise creation continues without an ancestry chain. Profile insert and referral-counter insert are separate operations, so partial failure/retry behavior needs resolution. |
| `POST /api/place-bet` | `{ match_id, picked, stake, client_bet_id?, expected_odd }` | Returns the atomic RPC JSON unchanged | Only listed score markets accepted; stake must parse as currency and be at least 5000 current units; expected odds must be positive and rounded to 3 decimals before RPC. Authenticated profile required. Handler maps unavailable market/invalid details to 400, settled/odds change to 409, missing profile/match to 404, unknown errors to 500. RPC must revalidate server balance, match state, market/odds, bet-count limits and atomic ledger effects. Existing duplicate-retry ordering concern remains open. |
| `GET /api/my-bets` | No query parameters | `{ status: "success", unsettled: Bet[], settled: Bet[] }` | Rows are scoped by authenticated profile username. Match start fields (`tsgmt`, `match_date`, `match_time`) are joined by `match_id`; if a match row is missing, original bet row is returned. |
| `GET /api/my-bet?id={id}` | `id` query parameter | `{ status: "success", bet: BetWithStartFields, match: Match \| {} }` | Bet query is scoped by authenticated profile username; unknown/foreign bet returns 404 `Bet not found`. |
| `GET /api/mobile/matches?limit={n}` | Optional limit, clamped to 1–50 (default 6) | `{ status: "success", matches: MatchSummary[] }` | Public server-side read of unverified future matches; response currently exposes a selected summary field set and adds `protectedMarket` from `comarket`. |
| `GET /api/mobile/match?id={id}` | Required match ID | `{ status: "success", match: Match }` | Public server-side read; missing ID: 400, missing match: 404. Response includes score-market odds and `protectedMarket`; verify whether company market fields are safe to disclose before reusing this as the native surface. |
| `GET /api/mobile/payment-data` | No query parameters | `{ status: "success", methods, destinations, wallets, settings, currency, withdrawalEligibility, pendingPaymentRequest }` | Authenticated; wallet list and eligibility are scoped by caller profile; payment methods/destinations are read server-side. Unlike `withdrawal-data`, this response includes pending-payment state. |
| `GET /api/pending-payment-request` | No query parameters | `{ pending: boolean, type: string \| null }` | Authenticated and explicitly `private, no-store`; native should not cache this as authoritative. |
| `POST /api/create-deposit` | `{ amount, method, methodName?, address, adminaddress, expectedRate? }` | `{ status: "success" }`; idempotent same-receipt replay returns `{ status: "success", reused: true }` | Authenticated. Receipt URL is used as replay key per user. Conflicting receipt reuse or pending request: 409; unavailable method/destination, invalid amount, or current minimum: 400; changed rate: 409. Server re-resolves method, rate and destination and stores a pending notification; do not trust client-provided amount conversion or payment destination. |
| `GET /api/withdrawal-data` | No query parameters | `{ status: "success", profile, wallets, methods, settings, currency, withdrawalEligibility }` | Authenticated; only the caller's wallet rows are loaded. No pending transaction is included in this response. |
| `POST /api/bindwallet` | `{ methodId?, walletname?, wallet, name?, bank? }` | `{ status: "success", message: "Wallet Binding Success" }` | Authenticated; available method must resolve; local/bank/mobile-money types require name and bank; duplicate wallet method returns HTTP 200 with `status: "failed"`. |
| `POST /api/withdraw` | `{ amount, method?, pass, wallet?, bank?, accountname? }` | `[{ status: "Success", message }]` | Authenticated; business failures frequently return HTTP 200 and `[{ status: "Failed", message, code?, retryAt? }]`. Requires withdrawal enabled, latest-deposit bet count, configured minimum, hard limit, PIN state/match, fresh rate, eligibility and sufficient balance. Atomic RPC snapshots rate/payout and reserves/deducts funds. Current handler compares submitted PIN directly to `profile.pin`; no throttling is visible here. Retry idempotency key is absent. |
| `POST /api/set-pin` | `{ pin }` | `{ status: "success", message }` | Authenticated; exactly 4 digits; existing `codeset` or non-empty PIN returns 409 and requires admin reset/change path. Handler writes PIN to `users.pin` as provided, so at-rest hashing/protection is not present in this handler. |
| `GET /api/wheel-spin` | No body | `{ status: "success", canSpin, nextSpinAt, lastPrize, revision, items }` | Authenticated, no-store; state is keyed by Supabase Auth user ID. |
| `POST /api/wheel-spin` | `{ revision }` | `{ status: "success", prizeIndex, prize, nextSpinAt }` | 409 cooldown if within 24 hours; 409 `wheel_updated` if revision differs. State update uses a conditional cutoff and unique-row race handling; server chooses prize. The endpoint records a prize label but does not itself grant a monetary balance. |
| `GET /api/notify` | Optional `?summary=1` | Default: `Notification[]`; summary: `{ notifications, unreadCount }` | Authenticated; merged response combines app notifications, referral/bonus/broadcast rows, bet wins, transactions, and admin rewards. `unreadCount` counts unread `app_notifications` only. `POST { action: "mark-read", ids? }` marks matching unread app notifications for the profile and returns `{ status: "success" }`; other POST bodies fall through to the GET-style listing behavior. |
| `POST /api/push/register-token` | `{ token, platform?, deviceId?, language? }` | `{ status: "success" }` | Authenticated; token required; platform defaults to android, language clamps to `en/fr/es/it/ru` (unknown becomes `en`); upsert keyed by token and binds it to current user. |
| `POST /api/push/unregister-token` | `{ token }` | `{ status: "success" }` | Authenticated if token is non-empty; empty token is an unauthenticated no-op success. Disables only a token owned by current Auth user. |

Authenticated routes use `Authorization: Bearer <Supabase access token>` and validate the token with Supabase Auth. Missing/invalid/expired session maps to HTTP 401 `{ status: "error", message }`; missing user profile maps to 404. `sendApiError` hides unclassified 500 details behind `Server error`. Individual handlers also have inconsistent response envelopes and method-not-allowed shapes; native repositories must model the actual endpoint explicitly rather than assume one global error schema.

Still required before freeze: inspect the exact live RPC definitions and deployed RLS/grants/storage policies for the selected project; record the full field schemas (including enums/nullability) for matches, placed bets, notifications, wallet methods/settings, and payment methods; decide signup identity verification and retry recovery; and get an approved way to exercise authenticated routes with synthetic account data. Repository SQL is not proof of deployed state.

### Additional checked-in database findings

- In `supabase_schema.sql`, `place_bet_atomic` locks the user row and match row, checks balance, daily bet count, settlement/start/market availability, snapshots the current odd and referral/VIP values, inserts the placed bet, deducts stake, increments `gcount`, and records user activity in one transaction. If `p_client_bet_id` already exists for the same user and match, it returns a reused response **after** the balance and `gcount` checks. The odds wrapper compares the accepted 3-decimal odd and raises on mismatch. Exact deployed function bodies remain unknown until the right project is identified and checked.
- The checked-in withdrawal RPC locks the user, checks enabled/configured limits, pending and 24-hour cooldown rules, daily/annual totals, and balance; it inserts a pending request containing the payout amount and method-rate snapshot, then deducts the requested total in one transaction. Current function contains a hardcoded 100 USDT payout cap and other USDT-specific error text; this is not a launch-market rule.
- The active hardening section of `supabase_schema.sql` enables RLS for selected private tables and adds owner policies, but does not enable RLS for every table the website/mobile clients read directly. Its wallet read/insert policy compares `user_wallets.uid` with `users.userid`, while the API computes wallet owner as `profile.uid || profile.userid`; this mismatch needs resolution before direct client access is allowed. The old combined SQL dump is historical evidence only and includes permissive policies; do not treat either checked-in file as the deployed policy set.
- The local repository therefore does not establish that public/anon roles are denied on old tables, that new policies were applied, that `trcreceipt` is private, or that old auth tokens/keys/endpoints have been disabled. The old and new apps share the same backend configuration today. A trustworthy shutdown likely requires an isolated project or a server-owned identity/market boundary plus removal/rotation of any old-client credentials; final design depends on target data migration and backend ownership decisions.
- `signup-profile` is a public service-role endpoint that accepts `userid` from the request body and does not validate it against a Supabase Auth user inside the handler. Before native signup is implemented, bind profile creation to a verified Auth identity or a server-issued, single-use signup proof and make profile/referral creation atomic or safely recoverable.

### Live Supabase metadata audit (2026-10-08)

The configured repository Supabase URL matched one connected project, so this read-only inspection queried that project's catalogs, migration history, and table metadata. No application rows were read and no database changes were made.

- Supabase's live table inventory reports **15 public tables with RLS disabled**: `users`, `user_wallets`, `bets`, `placed`, `notification`, `activa`, `referral`, `walle`, `upcoming_matches`, `admin_settings`, `useractivity`, `admin_impersonation_audit`, `reading`, `vip_daily_rewards`, and `platform_migrations`. The security advisory states these tables are exposed to the `anon` and `authenticated` Data API roles, allowing row access without the intended user-level RLS boundary. This includes account/profile and PIN fields, bet history, transaction requests, wallet destinations, and payment configuration. This is a **critical release blocker** for the native app and means the old-app shutdown cannot be achieved by Next.js auth checks alone.
- `app_notifications`, `push_tokens`, `depositwallet`, and wheel tables have RLS enabled and current policies were returned for owner-scoped app notifications/push tokens and public reads of deposit wallets/payment methods. This is only the current policy metadata; it does not make the rest of the shared public schema private.
- Live `trcreceipt` bucket metadata: `public=true`, allowed MIME types `{image/*}`, and no configured file-size limit. Therefore receipt objects are publicly readable by URL and storage uploads have no bucket-level size cap. Native implementation must remain gated until Operations/Security approves whether this is acceptable or supplies a private, authenticated upload design and retention limit.
- Live `place_bet_atomic` is granted to `anon`, `authenticated`, `postgres`, and `service_role`; it accepts `p_userid` as an argument and performs the bet/debit under that supplied identity. The HTTP handler's authenticated identity binding does not protect direct PostgREST RPC callers. Revoke or redesign this exposure through an approved backend security change before a customer release; do not invoke it directly from the native client.
- Live `place_bet_with_expected_odd_atomic` is service-role-only, consistent with the current Next API path. The live wrapper checks the accepted odds after the atomic placement and raises on mismatch. The deployed base function enforces the currently configured 5000 minimum and MMK balance wording, and retains the duplicate-retry ordering issue: balance and daily bet count are checked before duplicate lookup.
- Live withdrawal RPC is granted only to `service_role`; the current body includes a hardcoded 500000 payout cap with stale `100 MMK` error text, alongside dynamic settings. The endpoint applies rate snapshots and atomic reservation/debit. The mismatch between configured cap and message needs an explicit server correction/approved currency decision.
- Live migration inventory includes changes through 2026-10-08, including wheel security, one-pending-payment enforcement, USDT-to-MMK ledger conversion, and editable wheel items. The live schema has 12 users and the receipt bucket has 1066 objects according to metadata counts only; these counts are not parity evidence and no associated records were read.

Required backend actions before Step 1 can freeze: security owner must design and apply table-grant/API remediation for the 15 exposed tables without enabling RLS or breaking necessary customer/admin behavior; remove public execution of raw financial RPCs and confirm all exposed function grants; decide whether existing accounts/sessions are migrated into a new isolated market/backend; secure receipt storage with bounded size/type and intended access/retention; and then rerun a read-only privilege audit plus negative access checks using synthetic accounts. This document records findings only; it does not authorize production remediation.

### User direction and no-RLS access-control path

**User decision (2026-10-08): Do not enable RLS.** Keep that as an explicit constraint. The preceding SQL block in the conversation was only the Supabase advisor's containment suggestion; it was not applied and is not part of this plan.

With RLS left off, the viable path is to stop granting browser/mobile database roles access to protected tables and expose required operations only through authenticated server APIs. This is a design direction for review, not an applied migration:

1. Revoke `anon` and `authenticated` table privileges on private/accounting tables and sensitive RPC execute privileges. Keep only deliberately public server-mediated reads; no private-table client grants. Existing APIs use service-role access, so every customer handler must derive the user identity from a validated Supabase Auth token and never accept a client-supplied user ID as authority.
2. Preserve required public data through Next API responses (fixtures, payment catalogues, support links) and authenticated APIs (profile, bets, transactions, wallets). Migrate customer and admin browser code that currently calls the public Supabase client directly before revoking its grants. Keep the service-role key server-only; give the admin console its own server authorization checks rather than making it depend on broad anon grants.
3. Move receipt uploads behind a bounded server upload endpoint or another approved private upload service. Do not give the new native client the current public receipt-bucket upload path.
4. Block the legacy installed app at both boundaries: remove its Data API/table/RPC access through grant changes, then retire or version-gate its old Next endpoints and invalidate legacy Auth sessions/keys under a coordinated cutover. A client header, package name, or embedded secret is not a trustworthy discriminator. Existing website/admin clients must be migrated to the server APIs and new public Auth configuration before rotating shared project credentials.
5. Before production cutover, prove with a synthetic account that old-client credentials cannot read or mutate private rows, execute money/bet RPCs, authenticate/refresh, or call legacy endpoints, while the new app and admin console still work.

Direct client dependencies found in the repository that this path must migrate:

- Customer website directly reads `bets` on `/user`, `/user/matches`, and `/user/match/[id]`; server endpoints `/api/mobile/matches` and `/api/mobile/match` already exist as candidate read surfaces.
- Website and legacy React mobile deposit flows directly read `walle`/`depositwallet` and upload receipts to `trcreceipt`. `/api/mobile/payment-data` exists as a server read surface; receipt upload still needs a server-side path.
- Website wallet binding directly reads `walle`; replace it with the authenticated payment-data endpoint.
- The legacy React mobile app directly reads `bets` and uploads to `trcreceipt`.
- Admin pages import the same public Supabase client and directly read/write private tables such as users, bets, transactions, wallets, and referrals. Those flows need server-side admin endpoints and authorization before public table grants can be removed; preserving the admin console remains a release gate.
- Existing `/api/mobile/matches` and `/api/mobile/match` are public service-role read endpoints; `/api/mobile/payment-data` is an authenticated service-role read endpoint. They provide migration seams, but their exposed fields and market configuration still need approval before they become the frozen native API.

This approach avoids enabling RLS, but it still requires production privilege changes, API migrations, credential/session cutover, and coordinated rollout. Do not start those changes until the access matrix, market/data boundary, and rollback plan are approved. The RLS-related freeze checklist item is replaced by the grant/API control gate below.

### Route-to-service trace

| Route | Actions and service calls found in website source |
| --- | --- |
| `/login` | Optional username lookup `POST /api/login-email`; Supabase `signInWithPassword`; links to registration, reset and landing page. |
| `/register/{referralCode}` | Supabase `signUp`; `POST /api/check-username`; `POST /api/signup-profile`; links to `/terms`, `/privacy`, `/login`. Referral code is the first catch-all URL segment. |
| `/passwordreset` | Firebase `sendPasswordResetEmail`; success dialog returns to `/login`. Provider mismatch recorded above. |
| `/privacy`, `/terms` | Static legal copy and Back to UCL link. Registration links both before consent. |
| `/user/faq` | Static FAQ content with expandable rows; shared navigation links to Home, Matches, Bets, Wallet/Fund, More/Account and Notifications. |
| `/user` | Authenticated `/api/me`, `/api/my-bets`, public `/api/platform-settings`, direct Supabase `bets` read. Candidate replacement read: `/api/mobile/matches`. |
| `/user/matches` | Direct Supabase `bets` read; selecting a match navigates to `/user/match/{id}`. Candidate replacement read: `/api/mobile/matches`. |
| `/user/match/{id}` | `/api/me` for account context; direct match read; `POST /api/place-bet` with server-confirmed odds and client bet ID. Candidate replacement read: `/api/mobile/match?id={id}`. |
| `/user/bets` | Authenticated `GET /api/my-bets`; selecting a row navigates to `/user/viewbet/{betid}`. |
| `/user/viewbet/{id}` | Authenticated `GET /api/my-bet?id={id}`; back to bets. |
| `/user/fund/**` | Direct Supabase reads of `walle` and `depositwallet`; `GET /api/pending-payment-request`; Storage upload to `trcreceipt`; `POST /api/create-deposit`; draft and success data in `sessionStorage`. Candidate authenticated server read: `/api/mobile/payment-data`; receipt upload still has no bounded server-side API. |
| `/user/depositsuccess` | Reads user-scoped success data from `sessionStorage` and Supabase session; no authoritative balance mutation. |
| `/user/bindwallet` | Reads eligible wallet methods; `POST /api/bindwallet`; success returns to account. |
| `/user/withdraw` | `GET /api/withdrawal-data`; `POST /api/withdraw`; redirects to PIN setup or wallet binding when required, then withdrawal success. |
| `/user/withdrawsuccess` | Completion surface after request submission; final status is pending server/admin processing. |
| `/user/history` | Authenticated `GET /api/my-transactions?type=all`. |
| `/user/account` | `GET /api/me`, `GET /api/platform-settings`, Supabase sign-out; referral copy/share and external support/community links. |
| `/user/refferal` | Authenticated `GET /api/my-referrals`; copies/shares `{websiteOrigin}/register/{referCode}`. |
| `/user/vip` | Authenticated `GET /api/me`; current profile response provides VIP progress. |
| `/user/wheel` | Authenticated `GET /api/wheel-spin`, `POST /api/wheel-spin` with configuration revision. |
| `/user/codesetting` | Authenticated `GET /api/me`, `POST /api/set-pin` with a 4-digit PIN and confirmation; server rejects an already-set PIN. |
| `/user/notification` | Authenticated `GET /api/notify`; `POST /api/notify` to mark items read; taps may route to Home. |

External support destinations are served by `/api/platform-settings` and currently have repository defaults. The actual targets must be confirmed by operations before adding native links.

### Existing URL and notification destination behavior

- Referral links are built as `{apiBaseUrl}/register/{referCode}`; the website catch-all registration route reads the first path segment as the referral code.
- The parallel mobile app asks Supabase to send reset links to `{apiBaseUrl}/login`. That is not a native callback contract yet; define verified HTTPS App Links/custom-scheme handling, token exchange, and post-reset navigation once the Supabase reset flow is confirmed.
- Push taps in the current mobile behavior read notification data `{ route, matchId?, betId? }`: `route=match` opens the match when `matchId` exists; `route=bet` opens bet details when `betId` exists; `route=referrals` opens referrals; other payloads open notifications. Device token registration/unregistration uses `/api/push/register-token` and `/api/push/unregister-token`.
- The target domain, accepted referral URLs, reset callback domain, and post-shutdown availability are launch decisions and remain unconfirmed. The app must not trust arbitrary notification URLs as navigation destinations.

### Security and transaction evidence found so far

- Customer API handlers authenticate a Supabase access token from `Authorization: Bearer …` via `getCurrentUser`, then resolve the profile using the authenticated user ID. Expired/invalid sessions return 401; missing profiles return 404.
- The bet API calls a service-role-only atomic RPC. A wrapper compares the three-decimal odds accepted by the RPC with the odds the user confirmed and raises on a mismatch, which rolls back the bet operation. `client_bet_id` is available to the RPC for retry/duplicate handling; its complete behavior still needs verification against the base function.
- The checked-in base bet RPC locks the user and match rows, checks balance, daily bet count, settlement state, match start, and market availability, inserts the bet and updates balance/activity in one transaction. It does not deduct a second time when it recognizes the same `client_bet_id`, but it checks balance and bet-count limits before the duplicate lookup. A retry after a successful request may therefore fail those checks before reaching the idempotent branch. **Treat retry idempotency as unproven until fixed or verified against the deployed function.**
- Withdrawal creation is delegated to a service-role-only atomic RPC. The current migration locks the user row, rejects insufficient balance, inserts one pending request, and deducts the amount in one transaction; configured daily/annual/24-hour rules and hardcoded USDT rules are current-market assumptions requiring operations review.
- The withdrawal API compares the submitted PIN with the profile PIN before invoking the atomic request RPC. Verify PIN-at-rest protection, attempt throttling, and lockout behavior before preserving that flow in a native client.
- Deposit approval and withdrawal approval/rejection use a finance RPC that locks the transaction and user rows and applies ledger updates transactionally. The customer deposit submission itself checks a pending request, snapshots a rate, and prevents receipt reuse.
- The deposit UI validates the selected receipt as an image MIME type but does not enforce a file-size limit in this component. It stores a public Storage URL in the deposit request; verify the deployed bucket's public/read and upload policies, allowed formats/size, and retention before native upload implementation.
- Wheel spin state is server-side and subject to a 24-hour cooldown; the migration says the spin result itself does not grant a balance/reward. The native client must not mint rewards.
- Old clients can access Supabase directly using the existing public client configuration, in addition to calling Next API routes. A header check on Next routes alone cannot satisfy the shutdown gate.

These are code/migration observations, not a production authorization audit. Actual deployed grants, RLS policies, database function versions, and storage policies still need to be verified against the target Supabase project before freeze.

### Auth mismatch that must be resolved

The website `/passwordreset` page uses Firebase Auth while website sign-in/registration and the separate React mobile app use Supabase Auth. The mobile reset redirects to `{apiBaseUrl}/login`; the website reset flow has no corresponding Supabase reset callback. The native app plan requires Supabase sign-in and a working reset/deep-link journey, so the reset provider and callback need explicit confirmation and an end-to-end test before freezing the auth contract. Do not silently copy the website reset implementation into the native app.

## Visual capture record

| Route/state | Observation | Evidence / next action |
| --- | --- | --- |
| `/login` | Local and public pages render “Welcome back”, email/username and password fields, forgot-password link, sign-in action, and create-account links. | DOM and screenshot observed at default viewport. Screenshot not retained due to a prefilled personal identifier. Capture at supported mobile widths and record validation, loading, error, and success states without entering or submitting credentials. |
| `/privacy` | A single-column legal page with a Back to UCL link, Privacy Policy heading, account-data and Supabase disclosure, and a last-updated date. Support points to an unspecified “official in-app support channel.” | DOM and screenshot observed at default viewport. Product/operations must provide the approved support destination. |
| `/terms` | A single-column legal page with a Back to UCL link, Terms heading, age/location eligibility, account security, funds/market-risk, and promotion/withdrawal restriction copy. | DOM and screenshot observed at default viewport. Current copy is not launch approval; legal/product review remains required. |
| `/user/faq` | Dashboard nav (Home, Matches, Bets, Wallet, More), English language selector listing English/French/Spanish/Italian/Russian, notification and account links, and an expandable FAQ list. The first answer describes EFC as an investment company and mentions a VIP investment opportunity. | DOM and screenshot observed at default viewport; first accordion answer expanded. That investment-oriented description needs legal/product review against the betting product and approved launch copy. Remaining FAQ answers, localized versions, and mobile layout remain pending. |
| `/user` offline | Local page showed “You are offline”, paused actions, disabled live-information and amount inputs, disabled Continue, Retry, and Home/FAQ/More links. | Initial offline screen observed; it is an offline state, not a substitute for the online source screen. Record mobile viewport and retry recovery once the page can reach its data services. |
| All other in-scope routes and states | Not captured. | Pending route-by-route captures for loading, populated, empty, validation, error, and success states, including narrow screens. |

No user accounts, live transactions, or legal agreements have been submitted during this inventory.

## Launch inputs and release gates

| Input | Current repository evidence | Decision |
| --- | --- | --- |
| Target countries and eligibility | Existing site contains phone country-code data and age/terms copy, which do not establish the new market. | **Unconfirmed; product/operations input required.** |
| Account/data boundary or migration | Shared website APIs and Supabase are present. | **Unconfirmed; backend owner input required.** |
| Currency, ledger, and payment rails/destinations | Repository includes MMK, FCFA, USDT, and payment-specific migrations/configuration. | **Unconfirmed; do not inherit these values.** |
| Languages | Current Next.js and mobile configurations list `en`, `fr`, `es`, `it`, `ru`; locale files also include `my`. | **Unconfirmed for launch.** |
| Customer website availability | Existing website/API host is configured in mobile code. | **Unconfirmed for launch.** |
| Support destinations | Must be traced from content and confirmed operationally. | **Unconfirmed.** |
| Approved legal text and eligibility rules | Existing pages provide current text only. | **Unconfirmed; legal/product approval required.** |
| Old-app server shutdown | Old app directly calls shared Next API and Supabase. Client headers or repository cleanup cannot enforce shutdown. | **Unconfirmed; must prove backend isolation or retirement of old endpoints/credentials.** |
| Release signing | Inline signing arguments have been removed from the working `package.json` command; Gradle's signing configuration accepts protected environment variables. The values were present in the committed package version, so changing the working copy does not remove them from Git history. The referenced repository keystore file is absent. | Treat the historical values as exposed; whether they were used and the rotation status are **unconfirmed**. Release signing needs protected inputs and an operations-owned rotation decision. |

## Freeze gate checklist

- [ ] Capture every in-scope mobile screen and loading, empty, error, success, validation, and narrow-screen states.
- [ ] Record navigation, form validation, displayed copy, and localization keys per screen.
- [ ] Trace every customer action to its API, Supabase operation, or external link; freeze request/response contracts.
- [ ] Record server-owned financial and betting invariants, idempotency behavior, and authorization requirements.
- [ ] Confirm all launch inputs in the table above.
- [ ] Define and prove the old-app shutdown design for both Next API and direct Supabase access.
- [ ] Revoke and re-audit direct table grants and financial RPC grants without enabling RLS; confirm no customer data or financial action is accessible through unauthenticated direct Supabase calls.
- [ ] Approve receipt bucket visibility, upload size/type limits, and retention, then verify deployed Storage policies.

**Step 1 is not complete until every item is checked or has an explicitly approved exception.** The Android module replacement and native implementation remain gated on this freeze; existing user changes must be preserved.
