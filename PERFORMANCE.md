# Website performance

Customer pages render independent dashboard sections as soon as their requests finish. The dashboard requests five open bets plus an exact open count, and does not retrieve settled history. Notification reads run concurrently. Related bet records share a single batched match lookup. Profile settings start loading alongside authentication/profile retrieval. Vercel functions use Frankfurt (`fra1`), near the Zurich database. Brimble configuration is outside this change.

## Client data

`lib/requestCache.js` stores bounded, deduplicated requests in memory. `authFetch` scopes private responses to the current user and access token, clears them on session changes, and invalidates them after successful mutations. Profile, bet history, transaction history and notifications have a 15-second freshness window; referral data has 30 seconds. Match-entry balance/VIP refreshes and manual retries bypass the freshness window. Pending payment requests and withdrawal eligibility are never cached. Final financial operations retain their existing live server-side checks.

Public links and payment configuration have a five-minute client freshness window. Public links also have a short browser/CDN TTL. Admin settings changes clear local public data and public-page caches; other clients receive link changes within the CDN/client TTL. Payment availability, rates and destinations are checked by the server at submission even when the wizard displays cached configuration.

## Loading and prefetching

`PerformanceLink` disables bulk viewport prefetching and warms a route on hover, focus or touch. `useBackgroundPrefetch` waits for useful dashboard/account content and an idle period, then warms only two likely destinations. Requests are serialized, deduplicated for five minutes, and skipped when offline, hidden, on 2G/3G or with Save-Data enabled. Navigation cancels queued speculative work. Prefetching never performs a financial action.

The admin shell loads dynamically. Team crests use Next image resizing, and selected customer/legal pages send fewer translation sections. Terms and privacy pages are generated statically.

## Service worker

Cache names include the Next deployment build ID. English and Burmese paths are normalized. Verified non-personalized page shells and public content use a 24-hour maximum cache age with background revalidation. Versioned assets use cache-first. Each runtime cache has a 100-entry cap and skips files larger than 4 MB. Quota failures do not affect network responses. Admin routes, personal bet-detail/match pages and private API responses are excluded. Logout/session changes clear user shells. Only routes with non-personalized initial props belong in the user-shell allowlist; review that list whenever SSR behavior changes.

## Pagination

The website opts into `page=1` on bet, transaction, referral and notification endpoints. Opaque numeric-ID cursors keep queries bounded without growing OFFSET scans. Bets page two streams independently; referral and notification pages maintain one cursor per source. Every result retains the original ownership filters. The UI provides a translated Load more control. Older mobile clients retain the original response shape when not opting into paging. Referral/bet summary cards describe the loaded records; transaction financial totals come from profile aggregates.

## Validation

Run `node --test tests/*.cjs`, `npm run check:i18n`, and `npm run build`. Performance regressions cover request coalescing, expiry, invalidation, account isolation, cursor ownership/exhaustion, concurrent notification reads, network-aware prefetch restrictions, service-worker exclusions and translation scoping. Live comparisons should use the same account and routes, report cold and cached visits separately, and distinguish shell paint from useful dashboard data. Do not submit financial transactions during read-only speed checks.
# Transaction performance

The submission target is p95 below 1,000 ms from submit to a server-confirmed result under a stated network/load profile. Uploads, manual finance approval and bank settlement have separate timing. Cold starts and regional/mobile network latency must be reported, rather than hidden by an average.

Login by username now uses one SDK-compatible request to `/api/login`. The SDK still owns token storage and refresh. Email login and token refresh use Supabase directly. New website registration supplies `profile_version: 2`: a private Auth trigger creates the profile/referral record in the same transaction as the Auth user. Email confirmation is handled explicitly. The authenticated provisioning endpoint remains for native/older clients and interrupted-registration recovery.

Deposit, withdrawal, bet, wallet binding and PIN APIs verify the current Auth user before writing. Each financial submit executes a single atomic database operation. Deposit and withdrawal attempt IDs persist their result under a user lock; changed details cannot reuse an ID. Web receipt ownership, current rates, fee quotes, wallet ownership, limits and the six-bet withdrawal rule are checked in that operation. Withdrawals save their exact original debit, including fees, for a correct refund if rejected later.

Read APIs verify signed claims against the SDK's cached JWKS, checking project issuer and authenticated role. Mutations always call Auth for a fresh user record. GET profile, payment preparation, bet/transaction/referral history and notification feeds use one service-only RPC each. Admin finance actions and dashboard aggregates also use one operation. Match synchronization is queued instead of blocking admin match reads. Client responses remain in user-scoped memory; account/token changes clear them, and confirmed writes invalidate affected lists and update returned balances. A read started before a write cannot repopulate an obsolete cache entry.

Notification jobs commit with signup, financial processing, settlement, company matches and wheel awards. The worker leases jobs with `SKIP LOCKED`, uses lease tokens, retries transient delivery with backoff, and retains failed jobs for diagnosis. Push failure never changes a committed financial result. Stable in-app notification IDs support at-least-once push delivery. The worker accepts only a random internal credential whose encrypted value is in Supabase Vault; the server-side claim RPC sees its hash.

Receipts are compressed when useful and upload on selection, with progress. New files use `public/web/<user-id>/<uuid>` to retain the existing public-folder upload policy. Owners can discard their own files. Storage inserts durably schedule orphan cleanup after 48 hours; new submissions require a receipt younger than 24 hours, and cleanup retains any receipt referenced by a deposit. A lost submit response never causes the browser to delete a potentially accepted receipt.

Deposit steps keep one mounted flow and check pending requests on entry; final submission rechecks in the database. Static customer shells replace translation-only SSR. Routes send their needed translation sections, including dynamic keys, and likely next routes warm selected memory-cached reads during idle time. Inter is self-hosted with its OFL license; seventeen remote font imports are removed. Feedback/loading dialogs use lightweight HTML. Material UI theming loads on the routes that use it, and the wheel shows its committed result before its presentation animation finishes.

## Measurement and checks

`Server-Timing` exposes authentication, database and total durations; server logs record route, method, status and stage timings without bodies or credentials. Browser diagnostics are available in `window.uclPerformance` and `ucl:operation` events. They stay in memory and make no analytics request.

- Run `node --test tests/*.test.cjs` and `npm run check:i18n`, then `npm run build`.
- Run `tests/transactions.sql` in an isolated/staging database. It rolls back all fixtures and checks atomic signup, idempotence, ownership/PIN checks, six-bet eligibility, exact refunds, private reads, worker leases/retries and receipt expiry/cleanup.
- `node tests/transaction-concurrency.cjs` targets only the local `afc-transaction-db` container/`afc_test` database. It checks ten simultaneous bet/withdrawal retries, parallel shared match locks, odds rollback, settlement exclusion and replay after settlement.
- Controlled API integration measurements used real Supabase authentication and the isolated transaction database: 12 successful samples each; observed maximums were login 419 ms, bets 296 ms, withdrawals 353 ms and deposits 317 ms. These are warm lab observations, not a production or worldwide guarantee.

## Rollout and rollback

Apply `20261013231435_optimize_transaction_flows.sql`, `20261014001707_align_receipt_storage_paths.sql`, and `20261014002400_queue_match_synchronization.sql` before deploying the application. Apply `20261013233841_configure_notification_worker.sql` after the production worker route exists. It enables async `pg_net` dispatch once a minute and prunes completed jobs after 14 days. All privileged RPCs are service-only; queue/attempt tables deny direct client access. No Brimble configuration is changed.

The old transaction functions remain for application rollback. The versioned web Auth trigger applies only to new registration metadata. To pause delivery, unschedule `afc-notification-worker`; pending jobs remain durable. Monitor queued/dead counts, attempts, lease expiry, `cron.job_run_details`, and `net._http_response` without exposing worker credentials or job payloads to public clients.
