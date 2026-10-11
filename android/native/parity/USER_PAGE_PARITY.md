# Android customer page alignment

The mobile website under `pages/user` is the visual source of truth for the Kotlin/Compose app under `android/native`. This change covers customer pages; authentication, public landing pages and admin screens are outside the requested scope.

## Route mapping

| Mobile website | Native route / implementation |
| --- | --- |
| `/user` | `home` / DashboardScreen |
| `/user/matches` | `matches` / MatchesScreen |
| `/user/match/[id]` | `match/{matchId}` / MatchDetailScreen |
| Match page bet drawer | `bet-slip/{matchId}/{market}` / BetSlipScreen |
| `/user/bets` | `bets` / BetsScreen, WebBetCard |
| `/user/viewbet/[id]` | `bet/{betId}` / BetDetailScreen |
| `/user/account` | `account` / AccountWebScreen |
| `/user/notification` | `notifications` / NotificationsScreen |
| `/user/history` | `transactions` / TransactionsScreen |
| `/user/refferal` | `referrals` / ReferralsScreen |
| `/user/vip` | `vip` / VipWebScreen |
| `/user/wheel` | `wheel` / WheelWebScreen |
| `/user/faq` | `faq` / FaqScreen |
| `/user/fund` | `wallet`, `deposit` / PaymentPage.Methods |
| `/user/fund/amount` | PaymentPage.Amount |
| `/user/fund/payment` | PaymentPage.Destination |
| `/user/fund/receipt` | PaymentPage.Receipt |
| `/user/depositsuccess` | PaymentPage.DepositSuccess; continue to home |
| `/user/withdraw` | `withdraw` / PaymentPage.Withdraw |
| `/user/withdrawsuccess` | PaymentPage.WithdrawalSuccess; done to account |
| `/user/bindwallet` | `bind-wallet` / PaymentPage.BindWallet |
| `/user/codesetting` | `pin` / PaymentPage.Pin |
| `/user/deposit`, `/user/address`, `/user/inputvalue`, `/user/transaction` | Website redirects to the deposit flow; no separate customer designs |

`UserWebStyle.kt` supplies the shared customer header, language picker, five-item bottom navigation, page background, icons, panels and translation helpers. Customer page layouts follow the web page sources, `UserDashboard.module.css` and `UserFund.module.css`. The website dictionaries in `locales/en/common.json` and `locales/my/common.json` and the Indonesian bank list are copied into the APK by Gradle. Inter, the star ball, stadium and ball fallback are bundled resources. Lucide and Solar icon geometry comes from the same icon sets used by the website. Font and Solar attribution files are included in APK assets under `licenses/`.

## Android branding and cached presentation

The 2026-10-10 follow-up intentionally gives Android a Champions League blue accent system while retaining the customer page structure. Green secondary tones, selected panels and success treatments now use navy, royal blue and cool blue surfaces. Status labels and icons still communicate their meaning. The existing website UCL logo is bundled for the header, legacy launcher icons and adaptive launcher foreground; regenerate sizes with `node scripts/sync-native-branding.mjs`.

Public customer images (including wheel prizes) share a 16 MiB bitmap memory cache and a 64 MiB disk cache under Android's disposable cache directory. Downloads are coalesced, limited to four at once and 8 MiB each, and decoded to at most 1024 pixels per edge. Images refresh after seven days, displaying cached artwork first and retaining it if offline. Android may reclaim disk cache. Cached usernames are account-scoped, refreshed from the profile response and cleared on logout or account mismatch; balances, spin eligibility and rewards are fetched from the server.

After the wheel lands on a confirmed server result, a navy reward dialog displays the credited MMK amount and prize image. Gold and white stars orbit for 4.8 seconds, then stop. Continue, outside tap and system Back dismiss the dialog. System animator scaling is respected, including Remove animations; the reward remains visible without motion. Recovered spins celebrate only after a fresh server response confirms a changed spin timestamp and valid credited amount.

## Validation

- `node scripts/check-native-ui-assets.mjs` checks customer copy keys in both website languages, directly referenced icons, bundled images and Inter.
- `scripts/build-native-debug.ps1` assembles development and production debug APKs using the existing protected build configuration.
- `testDevelopmentDebugUnitTest` covers receipt draft retention, reviewed-rate/destination invalidation, account identity isolation, image persistence/expiry/storage bounds and server reward amounts.
- `lintDevelopmentDebug` checks Android source and resources.

Recorded on 2026-10-10: both final branded debug APKs assembled successfully and their signatures verified; all 16 unit tests passed; Android lint completed with zero errors (warnings remain); the asset contract checked 216 website keys in both languages. Packaged dictionaries, the bank list and license files were compared with their source files.

No authenticated financial action was submitted during verification. Read-only quotes and the existing submission endpoints remain authoritative; the withdrawal and bet quote are requested inside the single submit action to follow the web interaction.

## Visual verification still required

No Android device or configured AVD is available in this workspace. Source alignment, successful compilation and asset checks are not proof of exact pixel equality. The existing reference captures cover authentication only and cannot validate these customer pages.

For visual sign-off, capture web and native customer screens with the same account data, language, time zone, viewport width, font scale and loading state. Compare the initial viewport and the scrolled content for every route above, including empty, error, disabled, pending and successful states. Compare the bet drawer and all four deposit steps. Android system bars and native picker surfaces are platform UI. Any remaining rendering differences must be resolved from these matched captures before claiming exact visual parity.
