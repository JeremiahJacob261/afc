# Generic error message audit

Date: 14 October 2026. Scope: English source messages in the website, mobile web app, native Android app, and admin console. Repeated translations, punctuation variants, console-only diagnostics, and background worker errors are grouped or excluded. This is a source audit and proposed copy catalogue, not a reproduction of the reported failed bet. Application code has not been changed.

## How to use this list

Choose wording from the actual failure reason, not just the screen or HTTP status. The possible causes below are conditions to distinguish; they are not claims about what happened to the reported bet. Only show a specific cause when the response or client state confirms it. For an unknown cause, explain what could not be confirmed and give a safe next step.

For money-related requests, a lost response does not prove failure. Never say “Your money was not deducted” or invite another submission unless the stored result confirms that it is safe. Preserve the original request ID when checking or retrying an uncertain request. Values in braces must come from current server data.

## Bet placement: replace one fallback with distinct outcomes

Current copy: **“Unable to place bet.”** (`messages.unablePlaceBet`), **“Invalid bet details”**, **“Server error”**, and Android's **“We could not identify why your bet failed…”**.

| Confirmed condition | Suggested message |
|---|---|
| Insufficient balance | “Your available balance is {balance}, but this bet requires {stake}. Enter a smaller stake.” |
| Stake below minimum | “The minimum stake is {minimum}. Enter {minimum} or more.” |
| Missing score selection | “Choose a score before placing your bet.” |
| Invalid numeric stake | “Enter a valid stake amount.” |
| Odds changed | “The odds changed from {oldOdds} to {newOdds}. Review the new odds before confirming.” |
| Betting has closed | “Betting has closed for this match.” |
| Match settled | “This match has already been settled. It no longer accepts bets.” |
| Selected market unavailable | “This score option is no longer available. Refresh the match to see available options.” |
| Maximum bets reached | “You have reached your daily bet limit. Try again after the limit resets.” The database checks the user's daily count, not a per-match limit. |
| Match missing | “This match is no longer available. Return to the match list.” |
| Session expired | “Your session expired. Sign in again to continue.” |
| Account profile missing | “We could not load the account needed to place this bet. Sign in again. If this continues, contact support.” |
| Previously accepted request | “This bet has already been placed. View it in My Bets.” Treat as an existing success, not an error. |
| Request ID reused with different details | “This bet request conflicts with an earlier attempt. Check My Bets before starting a new bet.” |
| Invalid request metadata / missing odds | “The bet details could not be verified. Reopen the match to load the latest details.” |
| Offline before submission | “You are offline. Reconnect before placing your bet.” |
| Timeout / lost response / uncertain result | “We could not confirm whether your bet was placed. Check My Bets before trying again.” |
| Confirmed server rejection, reason unavailable | “Your bet could not be placed. Refresh the match and try again. If this continues, contact support.” |

Evidence: `pages/user/match/[id].js:422–449`, `pages/api/place-bet.js:29–83`, `mobile/src/App.jsx:1507–1516`, and `android/native/app/src/main/java/com/pro/uclfootball/network/SubmissionFailureMessages.kt`.

## Account, sign-in, and shared messages

Most current customer strings are in `locales/en/common.json:132–229`; shared fallbacks are also at `errors`, `bulletin`, and `website` keys. Android equivalents are in `android/native/app/src/main/res/values/strings.xml`.

| Current generic message(s) | Conditions to distinguish | Suggested replacement(s) |
|---|---|---|
| “Something went wrong.” / “Something went wrong!” / “An error occurred” / “Error occurred” / “Unknown error” / “Please try again.” | Unknown failure; action matters | “We could not complete {action}. Try again in a moment.” For submissions, use the uncertainty wording for that action instead. |
| “Server error” / “Request failed” / “Network request failed.” / “Request failed ({status})” | Service error vs connectivity vs rejection | Confirmed service issue: “This service is temporarily unavailable. Try again later.” Connection failure: “We could not connect. Check your internet connection and try again.” Known rejection: show its specific reason. |
| “Network error” / “Connection problem” / “Unable to connect. Reconnect and retry.” | Offline vs server unreachable | Offline: “You are offline. Reconnect to continue.” Otherwise: “We could not reach the service. Try again in a moment.” |
| “Unable to sign in. Check your connection and details.” / “Unable to sign in. Please try again.” / “login failed” | Incorrect credentials, unconfirmed email, throttling, offline, service error | “The username, email, or password is incorrect.” / “Confirm your email before signing in.” / “Too many sign-in attempts. Try again {time}.” / connection or service wording above. |
| “Incorrect details” / “Incorrect login details.” | Credentials rejected | “The username, email, or password is incorrect.” Do not reveal which account identifier exists. |
| “Unable to validate username right now” | Availability check failed vs username taken | “We could not check whether this username is available. Try again.” / “This username is already taken. Choose another.” |
| “Unable to create account. Check your connection.” / “We could not create your account. Please try again in a moment.” | Input rejection, existing account, partial registration, uncertain result | Identify the invalid field when known. Unknown result: “We could not confirm account creation. Try signing in before registering again.” |
| “Unable to create user profile” | Authentication account exists but profile setup failed | “Your account setup is incomplete. Sign in to continue setup. If this continues, contact support.” Only promise resumable setup where supported. |
| “Unable to send email” / “Unable to send reset email.” / “Unable to send a reset email. Check the email address and try again.” | Invalid format, throttling, mail service failure | “Enter a valid email address.” / “Too many reset requests. Try again {time}.” / “We could not send the reset email right now. Try again later.” Do not blame the address for a service outage. |
| “Too many attempts. Please wait and try again.” | Rate limit with or without retry time | “Too many attempts. Try again in {duration}.” If no time is known: “Too many attempts. Wait a few minutes before trying again.” |
| “An error occurred. Please try again.” during sign-out | Sign-out not confirmed | “We could not confirm that you signed out. Try signing out again.” |
| “Unable to copy” | Clipboard unavailable or permission denied | “We could not copy this automatically. Select the text and copy it manually.” Ensure the text is selectable. |
| “Mobile auth is missing Supabase config.” / “Mobile storage is missing Supabase config.” | App configuration error | “Sign-in is unavailable in this app version. Contact support.” / “Receipt uploads are unavailable in this app version. Contact support.” |
| “Unauthorized” | Expired session vs missing permission | “Your session expired. Sign in again.” / “Your account does not have permission to do this.” |
| “Not found” / “Method not allowed” / “JSON required” | Missing resource or incompatible client request | Name the missing item; for incompatible requests: “This action could not be completed. Reload the page and try again.” Keep protocol details in diagnostics. |

## Loading and unavailable content

For every loading failure below, distinguish offline, expired session, unavailable service, missing item, and empty results. An empty list is not a loading error. Do not display zero balance or “no bets” as a substitute for missing data.

| Current message(s) | Suggested default when cause is unknown |
|---|---|
| “Unable to refresh account data right now.” | “We could not update your account information. Refresh to see your latest balance.” |
| “Unable to load profile.” / “Unable to load your account. Please retry.” | “We could not load your account details. Try again.” |
| “Unable to load matches.” / “Fixtures unavailable” | “We could not load the match list. Try again.” |
| “Unable to load match.” | “We could not load this match. Try again.” For a confirmed missing match: “This match is no longer available. Return to the match list.” |
| “Unable to load bets.” / “Bets unavailable” | “We could not load your bets. Refresh to check their status.” |
| “Unable to load open bets. Open your bets to try again.” | “We could not update your open bets. Open My Bets to check their status.” |
| “Unable to load bet.” | “We could not load this bet's details. Open My Bets to check its status.” |
| “Unable to load transactions.” / “Unable to load transactions. Please retry.” / “Transactions unavailable” | “We could not load your transaction history. Refresh before submitting another payment request.” |
| “Unable to load referrals.” / Android retry variant | “We could not load your referrals. Try again.” |
| “Unable to load VIP progress.” | “We could not load your VIP progress. Try again.” |
| “Unable to load PIN status.” | “We could not check whether you have a transaction PIN. Refresh before setting one.” |
| “Unable to load notifications.” / Android retry variant | “We could not load your notifications. Try again.” |
| “Unable to load payment data.” / “Unable to load withdrawal data” | “We could not load payment methods and limits. Refresh before continuing.” |
| “Unable to check pending requests” | “We could not check your pending payments. Open Transactions before submitting another request.” |
| “Unable to load platform settings” | “We could not load the service settings. Refresh before continuing.” |
| “Unable to load this content.” / “We could not load this information. Please try again.” | Name the content: “We could not load {content}. Try again.” |
| “Could not refresh. Previously loaded information is shown.” | Already useful. Prefer contextual wording: “We could not update {content}. You are viewing previously loaded information.” |
| “Referral link unavailable” | “We could not load your referral link. Refresh your account and try again.” |
| “Download not available yet” | “The app download is unavailable right now. Try again later.” Do not imply a planned launch unless confirmed. |
| “Date unavailable” | “The date is unavailable.” Add the affected event, such as “The transaction date is unavailable,” where context is ambiguous. |

## Deposits, withdrawals, wallets, PINs, and wheel

| Current message(s) | Conditions to distinguish and proposed messages |
|---|---|
| “Deposit submission failed.” | Pending request: “You already have a pending payment request. View it in Transactions.” Used receipt: “This receipt is already linked to a deposit. Check Transactions.” Changed rate: “The exchange rate changed. Review the updated amount before submitting.” Unknown outcome: “We could not confirm your deposit request. Check Transactions before submitting it again. Do not make another transfer for this attempt.” |
| “Unable to submit withdrawal.” | Wrong PIN: “The transaction PIN is incorrect. Enter your 4-digit PIN.” Balance: “Your available balance is {balance}; this withdrawal requires {total}, including fees.” Limits: “Your remaining {period} withdrawal allowance is {remaining}.” Cooldown: “You can request your next withdrawal after {time}.” Pending: “Your previous withdrawal is still pending. View it in Transactions.” Eligibility: state the exact unmet requirement and current progress. Unknown outcome: “We could not confirm your withdrawal request. Check Transactions before submitting it again.” |
| “Withdrawals are temporarily unavailable. Please try again later.” / “Withdrawals unavailable” | Disabled by operator vs data load failure. Confirmed disabled: “Withdrawals are temporarily paused. {verifiedReason}.” Add reopening time only if known. Load failure: “We could not check withdrawal availability. Refresh and try again.” |
| “Unable to upload receipt” / “Unable to upload receipt. Please try again” / “Upload failed. Submit to retry.” | Invalid file: “Choose a JPEG, PNG, or WebP receipt image up to 8 MB.” Use limits for the actual uploader. Unreadable file: “We could not read this image. Choose it again.” Failed upload: “We could not upload your receipt. Retry the upload.” Unknown submission result: check Transactions first. |
| “Invalid receipt” / “Invalid receipt URL” | Missing image vs invalid/expired upload reference | “Choose your payment receipt image.” / “This receipt upload could not be verified. Upload the image again.” |
| “Invalid deposit details” | Missing method, amount, or receipt | Highlight the relevant field: “Choose a payment method,” “Enter a valid deposit amount,” or “Upload your payment receipt.” |
| “Invalid amount” / “Invalid amount or request id” | Bad amount vs request metadata | “Enter an amount greater than zero.” For request conflict: “This request could not be verified. Check Transactions before starting a new request.” |
| “Please fill all wallet details correctly.” | Missing or invalid account name, number, bank, address | “Enter the account holder's name.” / “Enter a valid account number for {bank}.” / “Enter a valid {network} wallet address.” Use method-specific validation. |
| “Unable to bind wallet.” | Duplicate, missing details, unavailable method, unknown result | “This wallet is already linked.” / field-specific guidance / “This payment method is unavailable.” Unknown: “We could not confirm whether the wallet was linked. Check your wallet list before adding it again.” |
| “Unable to set PIN.” | Invalid format, PIN already set, uncertain save | “Enter exactly 4 digits.” / “A transaction PIN is already set. Contact support to reset it.” Unknown: “We could not confirm whether your PIN was saved. Refresh to check its status.” |
| “Rate unavailable” / “{currency} payout unavailable because rate is missing” | Missing exchange rate | “We cannot calculate the {currency} payout right now. Choose another payment method or try again later.” |
| “Failed” transaction status | Rejected vs technical failure vs unknown | Show status plus reason: “Rejected: {safeReason}.” If absent: “This request failed, but no reason is available. Contact support with transaction {reference}.” Do not guess whether funds were returned. |
| “Unable to load the wheel. Please try again.” | Offline, loading error, wheel unavailable | “We could not load the wheel. Try again.” If disabled: “The wheel is unavailable right now.” |
| “The spin could not be completed. Please try again.” | No spins, stale wheel, uncertain result | “You have no spins remaining.” / “The wheel changed. Reload it before spinning.” / “We could not confirm your spin result. Reload the wheel to check your latest spin and balance before trying again.” |
| “We could not identify why this request failed. Try again in a moment…” | Native general fallback | Name the action. For saves: “We could not confirm whether {change} was saved. Refresh to check before trying again.” |
| “We could not identify why this request failed. Check Transactions before trying again…” | Native payment fallback | “We could not confirm your {deposit/withdrawal} request. Check Transactions before submitting it again.” |

## Admin messages

Locations: `pages/admin/control/index.js`, `full/[id].js`, `finances/index.js`, `notify.js`, `paymentmthod/index.js`, `bets.js`, `select/index.js`, `reward/index.js`, `matchdetail/[id].js`, `input/index.js`; wheel API fallbacks in `pages/api/admin/`.

| Current message(s) | Suggested replacement and required distinctions |
|---|---|
| “Unable to load settings” / “Unable to load user” / “Unable to load this user.” / “Unable to load fixtures” / “Unable to load payment methods” / “Unable to load matches. Try again.” / “Unable to load placed bets. Try again.” / “Unable to load transactions” | “We could not load {resource}. Retry.” Distinguish expired admin session, insufficient permission, and deleted resource. |
| “Unable to save settings” / “Unable to update withdrawal availability” | “We could not confirm your settings were saved. Reload settings to check before saving again.” Show exact field validation or permission reason when known. |
| “Unable to save payment method” / “Unable to update availability” | “We could not confirm the payment method update. Reload the method to check its current settings.” |
| “Unable to delete payment method” | “We could not confirm whether this payment method was deleted. Refresh the list.” If blocked by use, explain the dependency only when confirmed. |
| “Unable to read logo file” / “Unable to upload image” | “We could not read this image. Choose it again.” / “We could not upload this image. Retry the upload.” Give type and size limits for confirmed file validation failures. |
| “Unable to save the wheel” | “We could not confirm the wheel was saved. Reload it before editing again.” Concurrent edit: “The wheel changed while you were editing. Reload and review the latest version.” |
| “Unable to process transaction” / “Unknown error occurred, please try again” | “We could not confirm the transaction update. Refresh its status before approving or rejecting it again.” For known conflict: “This transaction has already been processed. Refresh to view its status.” |
| “Unable to settle match” | “We could not confirm settlement. Refresh the match and settlement records before trying again.” Separately identify already-settled matches and invalid scores. |
| “Unable to read match status” | “We could not check this match's settlement status. Refresh before changing it.” |
| “Unable to update odd” | “We could not confirm the odds update. Reload the match to check the current odds.” For invalid input: “Enter valid odds for this score option.” |
| “Unable to upload bet” | This admin action creates a match: “We could not confirm this match was added. Check the match list before trying again.” Preserve the existing specific duplicate-match warning. |
| “Unable to send reward” | “We could not confirm whether the reward was credited. Check the user's transaction history before sending it again.” |
| “An error occurred” / “Error occurred” on user administration | Name the action: “We could not confirm the {balance/deposit total/account/referral} update. Reload the user record to check.” Use the actual operation name. |
| “Unable to login as user” | “We could not start a session as this user. Refresh the user record and try again.” If unauthorized, explain the missing permission. |
| “Password reset failed” / “PIN reset failed” | “We could not confirm the password/PIN reset. Check the operation status before attempting another reset.” Do not display the secret in an error. |
| “wrong admin” / “wrong admin password” | “The admin password is incorrect.” Only when authentication actually rejected the password; otherwise use service or session wording. |

## Implementation findings and priorities

1. **Bet catch-all hides the reason.** `pages/user/match/[id].js:449` always displays `messages.unablePlaceBet` on a caught exception. At line 436, unmapped server messages also use that fallback through `lib/translateApiMessage.js`. This confirms how the wording is reached, not which condition caused the user's attempt.
2. **Validation can give a false explanation.** `pages/api/place-bet.js` combines missing match, invalid selection, invalid stake, invalid odds, and invalid client ID into one “Minimum stake” response. Split the validations before selecting copy. Native `SubmissionFailureMessages.kt` also treats all “Invalid bet details” as a minimum-stake failure.
3. **HTTP status is not a business reason.** Native bet handling maps otherwise-unrecognized 409 responses to changed odds. A conflict alone does not establish that cause.
4. **Translation matching is context-sensitive but not consistently scoped.** `lib/translateApiMessage.js` uses substring matching; its general minimum/maximum MMK branch can select withdrawal wording for an unmatched non-withdrawal message, and its general “temporarily unavailable” branch selects withdrawal copy. Use action-specific codes and mappings.
5. **Web/mobile/native do not preserve the same detail.** The native mapper already recognizes many payment and betting reasons, while mobile web often exposes `error.message` and the website often translates to a fallback. Align reason codes and translations across all three clients.
6. **Introduce stable reason codes and structured values.** Examples: `BET_INSUFFICIENT_BALANCE`, `BET_MINIMUM_STAKE`, `BET_ODDS_CHANGED`, `BET_CLOSED`, `BET_LIMIT_REACHED`, `SESSION_EXPIRED`, and `SUBMISSION_UNCONFIRMED`. Include amounts, limits, retry times, and a support reference when available. Keep internal exceptions in logs.
7. **Keep unknown outcomes explicit.** An unknown response should lead to checking stored status using the original request ID, not silently creating another transaction. A specific rejection and an uncertain submission need different buttons and messages.

Recommended order: bet placement; deposits and withdrawals; authentication and PINs; content loading; admin operations. Verify each mapped reason and an unknown-outcome case when implementation begins. No runtime tests were run for this documentation-only audit.
