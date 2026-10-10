# Native API deployment handoff

## Current state

Supabase project `pctajnbqkposgymgbqkc` has the seven targeted native migrations listed in `SOURCE_PROGRESS.md`. RLS and legacy financial grants are unchanged. Next.js API changes are local and must be deployed to the existing Vercel project `jeremiahxs-projects/afc` serving `www.europeanfc01.com`.

The signed integration APK is `artifacts/native/ucl-1.0.0-1.apk`. It has the production package and service configuration, but registration, payments, PIN, betting and production wheel mutations are disabled. It is not the complete replacement release.

## Server environment required before deploying PIN changes

- Retain the existing server-only `SUPABASE_SERVICE_ROLE_KEY` and existing public Supabase URL/key configuration.
- Set server-only `TRANSACTION_PIN_PEPPER` to the already generated protected secret. Its local DPAPI copy is `%LOCALAPPDATA%/UclNative/server-secrets/transaction-pin.xml`. Dot-source `scripts/load-server-pin-secret.ps1` only in a server/deployment process. Never print it, commit it, prefix it with `NEXT_PUBLIC_`, or pass it to Gradle.
- Preserve a portable protected backup of that pepper before storing real hashed PINs. Losing or changing it makes those PINs unverifiable.
- Keep `UCL_NATIVE_REGISTRATION_ENABLED`, `UCL_NATIVE_BETTING_ENABLED` and `UCL_NATIVE_RECEIPT_UPLOAD_ENABLED` unset or `false` until their integration gates pass.
- Keep `UCL_ANDROID_VERSION_CODE`, `UCL_ANDROID_VERSION_NAME`, `UCL_ANDROID_APK_URL`, `UCL_ANDROID_RELEASE_ORIGIN` and `UCL_ANDROID_APK_SHA256` unset until an approved APK is actually published. The current release JSON contains an intended URL, not a live download.

The new PIN handlers affect the existing website as well as Android. Do not deploy them without the server pepper. Missing configuration deliberately returns 503.

## Deployment and checks

1. Provide access to the existing Vercel project. Supabase Auth/Database access does not provide Next.js deployment access.
2. Deploy the prepared API changes with the required server environment; preserve the unrelated user edit in `pages/user/notification.js`.
3. Verify authenticated API contracts with a designated integration account. Check denied/expired sessions, PIN attempts/reset races, quote changes, bet retries and withdrawal/deposit concurrency before enabling mutation gates.
4. Complete receipt privacy/retention and retry checks. The current native upload adapter uses the existing public bucket, and its 8 MB limit must also be reconciled with the hosting request-size limit before activation.
5. Complete withdrawal request UUID idempotency and comparison with the user's reviewed total, plus legacy direct-access and old-app retirement work.
6. Run the plan's device, screenshot, push, recovery, installation and upgrade checks. No device is connected and no emulator AVD is configured on this workstation.
7. Only after full parity and shutdown sign-off, enable the approved journeys, publish the signed replacement and remove Capacitor/Capgo.

Do not run the entire `supabase_schema.sql` on production to deploy these changes; the targeted migrations are already applied.
