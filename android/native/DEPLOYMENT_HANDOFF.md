# Native API deployment handoff

## Current state

Supabase project `pctajnbqkposgymgbqkc` has the targeted native migrations, including the plaintext PIN correction, listed in `SOURCE_PROGRESS.md`. RLS and legacy financial grants are unchanged. The user confirmed deployment to the existing Vercel project `jeremiahxs-projects/afc` serving `www.europeanfc01.com`; public route checks on 2026-10-10 confirm the new endpoints respond. Authenticated integration and redeployment of the plaintext PIN correction still need verification.

The first integration APK `artifacts/native/ucl-1.0.0-1.apk` has disabled journeys and is superseded by signed version 2, `artifacts/native/ucl-1.0.1-2.apk` (version name `1.0.1`). The user requested removing the added restrictions: native registration, payments, PIN, betting, wheel spins and valid support links are now enabled in source. API environment switches were removed. PIN attempts are unlimited, and native profile creation has no extra email-confirmation requirement. Runtime/device and cutover checks remain outstanding.

## Server configuration

- Retain the existing server-only `SUPABASE_SERVICE_ROLE_KEY` and existing public Supabase URL/key configuration.
- The user explicitly chose plaintext four-digit PIN storage. The revised PIN APIs do not require `TRANSACTION_PIN_PEPPER`; no PIN hashing or secret initialization/loading scripts remain in the source.
- The `UCL_NATIVE_REGISTRATION_ENABLED`, `UCL_NATIVE_BETTING_ENABLED` and `UCL_NATIVE_RECEIPT_UPLOAD_ENABLED` switches were removed at the user's direction; they no longer control the revised APIs.
- Keep `UCL_ANDROID_VERSION_CODE`, `UCL_ANDROID_VERSION_NAME`, `UCL_ANDROID_APK_URL`, `UCL_ANDROID_RELEASE_ORIGIN` and `UCL_ANDROID_APK_SHA256` unset until an approved APK is actually published. The current release JSON contains an intended URL, not a live download.

The revised PIN handlers affect the existing website as well as Android. Redeploy the updated server source to remove the pepper requirement from the live API. Supabase migrations `restore_plaintext_transaction_pins` and `remove_native_launch_restrictions` are already applied. PIN snapshot checks remain in place; attempt limits were subsequently removed. An aggregate database check found no scrypt PIN hashes, so no existing PIN data needed conversion.

## Deployment and checks

1. Deployment was reported complete and checked at the public route boundary. Ongoing server changes still require access to the existing Vercel project or deployment by its owner.
2. Redeploy the plaintext PIN and restriction-removal revisions; preserve the unrelated user edit in `pages/user/notification.js`.
3. Verify authenticated API contracts with a designated integration account. Check denied/expired sessions, PIN attempts/reset races, quote changes, bet retries and withdrawal/deposit concurrency before claiming end-to-end validation.
4. Complete receipt privacy/retention and retry checks. The current native upload adapter uses the existing public bucket, and its 8 MB limit must also be reconciled with the hosting request-size limit before claiming complete integration.
5. Complete withdrawal request UUID idempotency and comparison with the user's reviewed total, plus legacy direct-access and old-app retirement work.
6. Run the plan's device, screenshot, push, recovery, installation and upgrade checks. No device is connected and no emulator AVD is configured on this workstation.
7. The user has enabled the customer journeys. Complete full parity and shutdown sign-off before publishing the complete replacement and removing Capacitor/Capgo.

Do not run the entire `supabase_schema.sql` on production to deploy these changes; the targeted migrations are already applied.
