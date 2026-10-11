# Matchday bulletin preview

Run `npx vite --config tests/bulletin-preview/vite.config.mjs` from the project root.
Open `http://127.0.0.1:3100/en/user/matches`, `/en/user/match/preview-1`,
`/en/user/bets`, or `/en/user/viewbet/preview-1`. Replace `en` with `my` to review Burmese.

The harness renders the actual website pages and shared shell against synthetic
future fixtures and won/lost/refunded bets. Its auth/API aliases never reach a
production account, and mutation requests are rejected. Stake entry can be
reviewed, but no bet can be placed.

Android's `src/debug` BulletinPreviewActivity similarly renders the actual
Compose content. Launch with `screen` set to `matches`, `match`, `bets`, `bet`, or
`stake`, and `language` set to `en` or `my`. It has no production submission
callbacks and is excluded from release builds.

Regression tests use fixed future timestamps independently of these relative-time
visual fixtures. Run `node --test tests/bulletin.test.cjs tests/i18n.test.cjs` and
Android's `testDevelopmentDebugUnitTest` task.
