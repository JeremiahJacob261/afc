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
