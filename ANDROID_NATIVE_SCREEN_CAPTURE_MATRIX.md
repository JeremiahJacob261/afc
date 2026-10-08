# Native parity screen capture matrix

This matrix keeps every in-scope route visible until Step 1 captures and records it. ?Observed? means inspected in the browser session, not an approved or checked-in screenshot. All native implementation remains downstream of this evidence.

| Route | Source | Reference capture | Loading | Empty | Validation | Error / offline | Success | Narrow screen / accessibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | `pages/login.js` | Desktop only; live and local DOM inspected; screenshot not retained due prefilled field | Pending | Pending | Pending | Pending | Pending | Pending |
| `/register/[[...id]]` | `pages/register/[[...id]].js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/passwordreset` | `pages/passwordreset.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/privacy` | `pages/privacy.js` | Desktop only; screenshot observed in session | Pending | Pending | Pending | Pending | Pending | Pending |
| `/terms` | `pages/terms.js` | Desktop only; screenshot observed in session | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/faq` | `pages/user/faq.js` | Desktop only; collapsed and first-answer-expanded screenshots observed in session | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user` | `pages/user/index.js` | Offline state only; desktop screenshot observed in session; online customer screen unavailable | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/matches` | `pages/user/matches.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/match/[id]` | `pages/user/match/[id].js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/bets` | `pages/user/bets.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/viewbet/[id]` | `pages/user/viewbet/[id].js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/fund` | `pages/user/fund.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/fund/amount` | `pages/user/fund/amount.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/fund/payment` | `pages/user/fund/payment.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/fund/receipt` | `pages/user/fund/receipt.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/depositsuccess` | `pages/user/depositsuccess.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/bindwallet` | `pages/user/bindwallet/index.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/withdraw` | `pages/user/withdraw.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/withdrawsuccess` | `pages/user/withdrawsuccess.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/history` | `pages/user/history.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/account` | `pages/user/account.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/refferal` | `pages/user/refferal.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/vip` | `pages/user/vip.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/wheel` | `pages/user/wheel.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/codesetting` | `pages/user/codesetting.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |
| `/user/notification` | `pages/user/notification.js` | Not captured | Pending | Pending | Pending | Pending | Pending | Pending |

## Required capture notes per route

- Record the viewport dimensions, system font scale, locale, and whether the user is signed in (use only approved non-production test data).
- Record navigation destinations, form rules, exact visible copy and localization keys, links, dialogs, sheets, and bottom-navigation state.
- Capture each relevant loading, empty, validation, error/offline, and success state. Mark a state N/A only after reviewing the source and confirming it cannot occur on that screen.
- Do not submit a bet, deposit, withdrawal, prize spin, legal acceptance, or other live transaction while collecting reference evidence.
- Preserve screenshot files only after they contain no personal data, credentials, account balances, or payment details.
