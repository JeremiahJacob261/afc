# Matchday Bulletin surfaces

This brief records the chosen direction and implemented composition for four customer betting surfaces. `DESIGN.md` owns their reusable visual tokens. Other UCL surfaces retain their existing authority.

## Matches

Show upcoming-only fixtures grouped by local kickoff date. Each compact row leads with league/local time and team names, followed by the three featured correct-score previews and an open-market affordance. Desktop columns stack on phones; native uses a scrolling list. Loading, unavailable, retry, and no-upcoming states have translated messages.

Evidence: `pages/user/matches.js`, `lib/fixtureDisplay.js`, `lib/matchDisplay.js`, `styles/MatchdayBulletin.module.css`, `android/native/app/src/main/java/com/pro/uclfootball/match/MatchesScreen.kt`.

## Match markets and stake entry

Lead with fixture identity, league, local kickoff, and company-game information. Follow with a divided correct-score matrix containing explicit available, selected, unavailable, and protected states. Open stake entry alongside the matrix at desktop widths (1100px minimum; 380px drawer), or in a bottom drawer below that width. Native uses a modal bottom sheet and retains its selected cell with primaryContainer fill and a 2dp primary border; selection is saved per match ID and exposed through selected semantics and a Button role. Both stake experiences show stake, current balance, use-all-balance, odds, profit, and submission feedback, with financial values in MMK. The website also shows a separate expected-return row; the current native sheet shows profit without that additional row.

Evidence: `pages/user/match/[id].js`, `styles/UserMatch.module.css`, native `match/MatchDetailScreen.kt` and `bets/BetSlipScreen.kt`.

## My Bets

Lead with summary metrics: unsettled, won, refunded, and total stake. Show two count-bearing tabs for unsettled and settled, followed by a ledger of fixture, pick, stake, return, and status. Desktop uses columns; intermediate/phone layouts place labels beside each numerical grouping; native stacks records below the two-by-two summary and Material tabs. Refunded rows say returned stake rather than potential return, and these labels remain visible on desktop. Web tabs use roving focus with ArrowLeft/ArrowRight to switch categories and Home/End to select first/last; the panel is labeled by its active tab.

Evidence: `pages/user/bets.js`, `lib/betDisplay.js`, `styles/MatchdayBulletin.module.css`, native `bets/BetsScreen.kt` and `bets/WebBetCard.kt`.

## Bet details

Lead with fixture and status. Follow with the selection and financial breakdown, side by side on larger web widths and stacked on phones/native. Keep stake, odds, profit, and return separate. Refunds show zero profit, returned stake, and an explanation; they must not imply winnings. Keep the reference identifier readable and allow wrapping. Web detail data is tied to the requested bet ID so navigation starts a fresh loading state rather than displaying the previous bet.

Evidence: `pages/user/viewbet/[id].js`, `lib/betDisplay.js`, `styles/MatchdayBulletin.module.css`, native `bets/BetDetailScreen.kt` and `ui/BulletinComponents.kt`.

## Shared copy, currency, and verification

English/Burmese web dictionaries own customer copy; native `webCopy` reads packaged `en`/`my` assets. Web `betMoney` and native `webMoney` format financial values in MMK. This is betting-surface presentation and does not change the USDT account-ledger product fact in `PRODUCT.md`.

The record is source-derived. Browser screenshots need recapture after loss of the Chrome connection; native screenshots need recapture after the emulator load issue is resolved. Visual verification is pending. Omitted native Material container/outlineVariant colors and legacy web stake-field styling remain drift, not canonized rules.
