# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The project also packages a web-based mobile experience in an Android Capacitor wrapper. Its interface remains web-based.

## Users

Primary audience: football bettors globally, as confirmed by the product owner.

The repository also contains an admin console for people who operate the platform. Their specific roles and priorities have not yet been confirmed.

## Product Purpose

The implemented product lets people find football matches, compare odds, place bets, follow results, and manage account and wallet activity. Its public landing page describes this as “Football Betting Made Simple.”

The particular outcome by which the product owner measures success remains open.

## Operating Context

Implemented journeys include account creation and sign-in, pre-match and live football markets, bet placement and history, deposits and withdrawals, referrals, VIP rewards, support, and an admin console. The public landing page includes 18+ and responsible-gaming guidance.

## Capabilities and Constraints

- The application is a Next.js web project. The USDT account ledger and local-currency payment methods are confirmed product facts; payment methods use conversion rates.
- The repository includes markets for match result, goals, both teams to score, correct score, and live betting.
- Match, wallet, referral, and VIP functions must be preserved in future design work. Administration flows also exist in the codebase.
- Global audience is confirmed. Supported regions, legal jurisdictions, and the priority language list remain open product decisions; no global availability or licensing claim should be inferred.
- UCL is the confirmed public name. The Android wrapper configuration still says EFC Football, so its naming needs alignment in a separate implementation task.
- The product's distinguishing promise beyond its implemented capabilities remains open.

## Brand Commitments

UCL is the confirmed public name. The current public landing page uses the line “Football Betting Made Simple”; whether that line is a permanent brand commitment remains open.

## Evidence on Hand

- Public content and assets: `components/ucl/`, `styles/LandingSystem.module.css`, and `public/landing-reference/`.
- Product behavior: `pages/user/`, `pages/admin/`, `pages/api/`, and `lib/`.
- Android wrapper identity: `capacitor.config.ts`.
- Legal and help routes: `pages/terms.js`, `pages/privacy.js`, and `pages/user/faq.js`.

No verified customer testimonials, licensing claims, performance claims, or market-leadership evidence were provided during initialization. Future design work should not fabricate them.

## Product Principles

- Serve football bettors globally without assuming a single local market.
- Make match choices, odds, and results understandable.
- Keep the USDT account ledger clear when a payment method uses a local currency.
- Preserve access to match, wallet, referral, and VIP functions as the interface evolves.

## Accessibility & Inclusion

The public landing experience is designed for keyboard access, responsive layouts, and reduced motion. The product owner has not specified a product-wide accessibility standard or additional user needs.
