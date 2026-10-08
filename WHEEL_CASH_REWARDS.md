# Cash wheel

The wheel awards spendable MMK directly to the account balance. Each slice has an equal chance. Users need a current balance of at least 100,000 MMK (20 × the platform's 5,000 MMK/USDT accounting rate), and can spin for free once every rolling 24 hours.

The original slice order is retained: 50,000, 5,000, 20,000, 100,000, 10, 500, 1,000, and 30,000 MMK. Admins can edit positive whole-MMK amounts, artwork, colors, and ordering. Labels are derived from amounts.

## Database and rollout

`WHEEL_CASH_REWARDS_MIGRATION.sql` was applied to the connected Supabase project `pctajnbqkposgymgbqkc` on October 8, 2026, after verifying the existing wheel and MMK ledger. Deploy the application changes after this migration. The migration is a one-time incremental migration; do not reapply it.

`spin_wheel_atomic` serializes operations on the user's balance and protects the wheel revision during selection. It commits the balance credit, immutable award snapshot, cooldown, and in-app notification together. Only the service role can execute it. Award history allows the service role to insert and read records, without update or delete access. Cash rewards do not increase deposit totals. Legacy visual-only spins retain their labels and cooldowns and receive no retroactive credit.

Push delivery runs after the transaction using the existing enabled-device infrastructure. Failure to deliver push does not undo an award or remove its in-app notification. An uncertain POST response triggers a state reload before another spin is enabled.

## Verification

- Run `npm run test:wheel`, `npm run test:i18n`, and `npm run check:i18n`.
- `tests/wheel-rewards.sql` verifies database payouts and rollback in a disposable PostgreSQL database with the wheel migrations applied. It rolls back its fixtures and simulated notification-failure trigger. Do not run the trigger test on production.
- Database scenarios were checked locally using PGlite. Hosted checks verified eligibility boundaries, all eight amounts, cooldowns, service-role execution, simultaneous spins (one award and notification), and a concurrent debit below the threshold. Hosted fixtures were rolled back or removed.
- Browser checks covered English and Burmese, desktop and mobile, the admin amount editor, locked and eligible states, reduced motion, payout/balance updates, and recovery after lost responses. The app API was mocked for browser payout tests, so these checks did not send real push notifications.

The standard Windows build encountered `EMFILE` while tracing the existing MUI icon imports. The verification build preloaded the existing `graceful-fs` dependency to queue filesystem operations. This workaround lives in a temporary validation script.

The eight transparent PNGs are in `public/assets/wheel/cash-*.png`. They were generated with the built-in image tool and resized to 384 pixels wide with alpha preserved. Exact prompts are embedded in each PNG and recorded in `public/assets/wheel/CASH_ASSETS.md`.
