# Country account currencies

The selected ISO country code determines an account's currency. Myanmar uses MMK; Zambia uses ZMW. The 14 countries in the West and Central African CFA franc zones use FCFA: BJ, BF, CI, GW, ML, NE, SN, TG, CM, CF, TD, CG, GQ, GA. All other countries use USDT.

Fixed account rates: 1 USDT = 5,000 MMK = 600 FCFA = 20 ZMW. USD is not a separate account currency.

## Accounting and existing accounts

The database retains its existing MMK accounting unit. User-facing amounts are converted by the server, so an existing balance of 5,000 accounting units appears as 5,000 MMK, 600 FCFA, 20 ZMW, or 1 USDT. Balances, historical bets, referral rewards, and pending transactions retain their value. No destructive multiplication or division of stored financial rows is needed.

The migration adds country_iso and currency_code to users, assigns existing users from saved signup metadata or existing calling codes, and provisions new profiles atomically. Missing non-special country information defaults to USDT. Existing country data is used instead of IP location or device language. Retrying profile creation cannot change the account's currency. Authenticated profile edits cannot change these currency fields.

The admin interface continues to report the shared accounting amounts in MMK.

## API contract

Updated website, mobile web, and native clients send X-Account-Currency-Contract: 1. The server derives the currency from the verified profile, converts account amounts in responses, and converts stake/withdrawal input back to the accounting unit before the existing atomic operations run. It does not accept a caller-selected exchange rate or denomination.

Versioned responses include currency.code, currency.unitsPerUsdt, currency.ledgerCode, and currency.contract. Updated clients reject a successful financial response that lacks this contract. Legacy clients retain their existing MMK API contract until updated. Native snapshots use schema version 2 and preserve response currency metadata; old snapshots are discarded.

Submitted deposit and payout amounts remain in the payment method's currency. Method exchange rates, odds, percentages, IDs and counts are not account amounts. Admin-configured payment methods and destination accounts remain authoritative; this change does not invent payment destinations for ZMW or any other currency.

## Rollout

1. Apply supabase/migrations/20261101145809_country_account_currency.sql to the same database used by the application.
2. Deploy the updated website/API. The migration and API must be deployed before distributing updated app clients.
3. Build and distribute the updated native app, and deploy/package the mobile web app if used. Existing app installations need the update to show their assigned currency.

Do not deploy the signup API before its new provisioning RPC exists. Rolling back clients to the legacy contract does not require rewriting balances.

## Validation

- JavaScript regression suite: node --test tests/*.test.cjs
- Website: npm run build
- Mobile web: npm run mobile:build
- Native: android/native/gradlew.bat -p android/native testDevelopmentDebugUnitTest
- Database: tests/country-currency.sql (transactional fixture test; rolls back)

The migration was also exercised in an isolated PostgreSQL runtime for backfill, value conservation, server-role provisioning, retry behavior, and RPC access grants. These local checks do not apply the migration to the live database.
