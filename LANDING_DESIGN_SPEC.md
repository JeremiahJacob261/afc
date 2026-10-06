# UCL Football — Landing Page Redesign

Target: `pages/index.js` (public marketing page, currently already UCL-styled).
Goal: same brand family as the register page, but a **structurally different** page —
atmospheric and interactive where registration is calm and task-focused.

---

## 1. Diagnosis of the current landing

The existing UCL landing is competent but generic. It reads as a dark SaaS template
wearing Champions League colours. Six specific problems:

| # | Problem | Evidence |
|---|---------|----------|
| 1 | **No typeface is loaded at all.** | `styles/globals.css` `@import`s ten Google fonts *after* the `@tailwind` directives (invalid position, so PostCSS drops them), and no `.ucl-*` class sets a `font-family`. Every heading renders in the system sans stack. |
| 2 | **The SaaS-card kit.** | `.ucl-panel .ucl-cut` is applied to ~30 cards in 7 identical grid sections. One radius, one border, one shadow, repeated. |
| 3 | **The uppercase-eyebrow tell.** | `.ucl-eyebrow` (tracked, uppercase, 0.28em) sits above *every* heading on the page. Structural chrome used as decoration. |
| 4 | **The angular clip-path is decoration, not structure.** | `.ucl-cut` appears on virtually every surface, so it stops signalling anything. |
| 5 | **Silver metallic gradient is used as decoration.** | `.ucl-silver` on the hero headline — a "premium effect" that flattens the words instead of powering them. |
| 6 | **Fourteen near-identical sections.** | eyebrow → display title → angled rule → copy → card grid, repeated seven times. No rhythm, no pacing. |

Two hard defects also block the design:

- **The legacy navy punches through.** `pages/_app.js` hard-codes `background: #06101F` on the root wrapper *and* injects an inline `style` prop onto every page component. `globals.css` sets `body { background: #10284D }`. The landing's dark blue is fighting three older backgrounds.
- **Dead nav link.** `UclNavbar` links *Agents* → `#agents`, but no section carries that id (`UclRewards` renders `id="bonuses"`).

---

## 2. Concept — "Pick the number"

The current page describes markets, bonuses and trust. It never dramatises the one
thing this product actually is: **committing to a single exact number before kickoff,
then waiting for the final whistle.**

So the entire page is organised around that single act, and the correct-score grid
becomes a working interface rather than an illustration.

**The signature element: the scoreline cell.** A large, faceted tile carrying a
scoreline (`2–1`) and a return percentage (`96%`). It recurs at three scales —
giant and interactive in the hero, mid-size in the markets section, small as a
data chip in the rewards ladder — so the page teaches one idea and reinforces it.
This is where the design spends its boldness. Everything around it stays quiet.

**Tone:** broadcast graphics. Scoreboard vernacular, not casino vernacular. This
product is about a number being right or wrong, so the page is typographic and
legible, not glittery.

---

## 3. Colour

The brief's palette is kept exactly. What changes is **discipline** — cyan and
magenta are currently sprinkled with no hierarchy, so nothing pops.

| Token | Hex | Role |
|-------|-----|------|
| `ucl-950` | `#000A1E` | Page ground |
| `ucl-900` | `#001240` | Raised surface, panel fill |
| `ucl-800` | `#002D72` | Stage gradient top, gradient terminus |
| `cyan-500` | `#00C2F3` | **Primary action only.** Selected state, links, focus. |
| `cyan-300` | `#7CEBFF` | Cyan-on-dark for small text (contrast) |
| `magenta-500` | `#FF2D95` | **Live/urgent only.** In-play, "LIVE" pulse, settlement. |
| `magenta-300` | `#FF8AC4` | Magenta-on-dark for small text |
| `silver-100` | `#F2F5FA` | Primary text |
| `silver-300` | `#C7CEDB` | Secondary text |
| `silver-500` | `#8B95A9` | Tertiary/meta text |

**Rules**

1. **One accent per viewport.** Cyan *or* magenta in view, never both competing.
   Magenta earns its place only where something is live or urgent.
2. **Silver gradient appears exactly once**, on the largest word on the page.
3. State meaning is fixed and never reassigned:
   cyan = *you can act here* · magenta = *this is happening now* ·
   silver-500 = *read-only metadata*.
4. Success/warn are **not** invented from the palette. Withdrawals settle and bets
   lose; those states need green and red, added as two functional tokens:
   `--ucl-pos: #34D399`, `--ucl-neg: #FB7185`. They appear only on result states.

---

## 4. Type

Two families, chosen for the broadcast vernacular. Both are currently missing.

**Display — Archivo (variable).** Loaded at `wdth 62..125, wght 400..900`.
The width axis is the point: the same family sets the compressed `.ucl-display`
headlines *and* the expanded (`wdth 125`) scoreboard numerals. It reads as sports
broadcast rather than as a startup.

**Text — Barlow.** Humanist, slightly technical, comfortable at 16–18px across
long French and Russian strings. Pairs with Archivo without competing.

**Numerals** — Barlow with `font-variant-numeric: tabular-nums` everywhere a
figure changes or aligns in a column (odds, returns, balances). No monospace.

### Scale (fluid, `clamp()`)

| Role | Size | Archivo width / weight |
|------|------|------------------------|
| Hero headline | `clamp(3rem, 9vw, 8.5rem)` | 62 / 900 |
| Section headline | `clamp(2rem, 4.5vw, 3.75rem)` | 62 / 800 |
| Scoreline numeral (hero) | `clamp(3.5rem, 7vw, 6rem)` | 125 / 900 |
| Scoreline numeral (mid) | `2rem` | 125 / 800 |
| Body | `1.0625rem` (17px) | Barlow 400 |
| Small/meta | `0.8125rem` | Barlow 600 |
| Eyebrow | `0.6875rem` | Barlow 800, `0.2em`, uppercase |

**Measure:** body copy capped at 62ch. Hero headline breaks at 9 characters max.

**Eyebrows — corrected.** `.ucl-eyebrow` currently decorates every heading. It is
kept for exactly **two** places where it carries real information: a league
competition name, and a live-match status. Every other heading drops it. Section
headings get no label above them at all.

---

## 5. Layout

Full-bleed, **asymmetric, left-weighted**, on a 12-column grid. Content never
centres except in the closing CTA. Max width 1440px, gutters 24/40/64px.

This is the structural separation from the register page. Registration is a
centred `max-w-lg` panel in a quiet two-column split — everything about it says
"do this one task". The landing has **no centred panel anywhere**, content runs to
the edges, and the eye is led left-to-right.

### Hero — the interactive board

Full viewport height. The correct-score grid is not an illustration; selecting a
scoreline updates a live return figure. This is the one live demo on the page.

```
┌────────────────────────────────────────────────────────────────┐
│ ★ UCL   Markets  Live  How it works  Bonuses  FAQ    EN▾  [JOIN]│
├────────────────────────────────────────────────────────────────┤
│  ░░░░ light rays from upper right ░░░░                         │
│  CHAMPIONS LEAGUE-STYLE · CORRECT SCORE        ┌──────────────┐ │
│                                               │  RMA  1–0 MCI │ │  ← 87:00, ticking
│  PICK THE                                     │  ▓▓▓▓ clock ▓▓▓│ │
│  NUMBER.                                      └──────────────┘ │
│                                                ┌─┬─┬─┬─┐        │
│  ══════◆══════                                 │0-│0│1│1│  0–0   │
│                                                │0│1│1│2│  78    │
│  One scoreline before                        │1│0│2│1│  74    │
│  kickoff. You either                          └─┴─┴─┴─┘        │
│  called it or you didn't.                      ┌─┬─┬─┬─┐        │
│                                                │1│2│2│2│  96    │
│  ─┬─────────┬─────────┬─────────               │0│1│1│3│  74    │
│  17      96%       145     RETURN               └─┴─┴─┴─┘        │
│  MARKETS  STAKE   RETURNS                       ▓▓ OTHER ▓▓       │
│                                               │  stake  10,000  │
│                                               │  returns 9,600  │
└────────────────────────────────────────────────────────────────┘
```

The board is the one interactive element on the page. Selecting a cell updates
a live return figure.

**Use the real market list.** The 17 correct-score options are fixed in
`pages/user/match/[id].js` (`marketsArray`, lines 51–69) and are the board's cells:
`0-0, 1-0, 0-1, 1-1, 2-0, 0-2, 2-1, 1-2, 2-2, 3-0, 0-3, 3-1, 1-3, 2-3, 3-2,
3-3` plus `Other`. Sixteen cells lay out as 4×4 with `Other` spanning the full
row beneath. The landing board must show the same sixteen scorelines as the bet
screen, or the hero is lying about the product.

**Use the real odds model.** Odds are percentage returns, not decimal:

```js
vip  = { 1: 0, 2: .10, 3: .20, 4: .33, 5: .47, 6: .63, 7: .83 }   // by VIP tier
odds = base * (1 + vip[userTier])                                  // rendered .toFixed(3)%
returns = stake * (odds / 100)                                    // 'N/A' when odds <= 0
```

The hero can show base odds with no VIP tier applied. The ticker and the rewards
ladder are the natural places to show what a tier does to them.

**Company-match state** (the premium tier — verified fixtures that refund the
stake on a loss) gets its own treatment: the cell takes a cyan left edge and the
board footnote swaps to the refund terms. It is differentiated by structure, not
by a badge.

### Section rhythm — deliberately broken

The current page repeats one rhythm seven times. New order, with two full-bleed
breaks so the page breathes:

| # | Section | Treatment | Ground |
|---|---------|-----------|--------|
| 1 | Hero | Asymmetric split, interactive board | `ucl-950` + rays |
| 2 | **Fixture ticker** | Full-bleed LED strip, horizontal scroll, auto-advancing | `ucl-900`, inset |
| 3 | Markets | Not a card grid — market tabs that **swap the hero board's contents** | `ucl-950` |
| 4 | How it works | Horizontal bracket timeline, not 4 cards | `ucl-950` |
| 5 | Rewards & VIP | Ascending ladder — VIP is a ladder, so show it climbing | `ucl-900` |
| 6 | Trust | Quiet, low-contrast, deliberately reads as fine print | `ucl-950` |
| 7 | FAQ | **Real accordion**, one open at a time | `ucl-950` |
| 8 | CTA + footer | Centred — the only centred moment | `ucl-800`→`950` |

**The ticker (#2)** is new and does real work: it separates hero from markets,
shows the product is live, and gives the page motion it currently lacks. It is a
single `<ul>` with `aria-live="off"` and pauses on hover/focus.

**Markets (#3)** reuses the hero interaction rather than describing it — tabs for
1X2 / Goals / BTTS / Correct score / Live swap the cell grid's contents. One
mechanic, taught once, reused. This is what kills the five-card grid.

**Rewards (#5)** as an ascending ladder, because that is what a VIP tier *is*:

```
        ┌─────────┐
        │  DIAMOND│  ← rung 4, magenta edge
     ┌──┴─────────┴──┐
     │    PLATINUM   │  ← rung 3
  ┌──┴───────────────┴──┐
  │       GOLD          │  ← rung 2
┌─┴─────────────────────┴─┐
│         BRONZE          │  ← rung 1
└──────────────────────────┘
   deposit threshold climbs left→right
```

**Trust (#6)** inverts the register page's confident checklist. It is set small,
in silver-500, low contrast, and reads like the small print of a contract —
because that is the honest register for a betting site that holds real money.

**FAQ (#7)** becomes a real accordion. Four static cards is a known pattern and
makes every answer compete with every other answer.

---

## 6. Motion

Sparingly. **One orchestrated load, then only user-triggered feedback.**

1. **Page load (the single moment).** Hero headline resolves, then the board's
   cells cascade in on a 12ms stagger. Runs once. Nothing else animates on scroll.
2. **Hover/focus a scoreline.** The cell scales to 1.03 and its left edge fills
   cyan; the return figure updates. User-triggered — it answers the action.
3. **Live pulse.** The magenta status dot on the ticker breathes at 2s. Tiny,
   continuous, and only on genuinely live fixtures.
4. **Accordion open/close.** Height transition, 180ms.

**Not doing:** no scroll-reveal on section entry, no hover-lift on every card,
no parallax, no entrance animation on any section below the hero.

All of it behind `@media (prefers-reduced-motion: reduce)` — cells appear at once,
the pulse stops, the ticker does not auto-advance.

---

## 7. Quality floor

- Responsive from 360px. The board grid drops 4 → 3 columns; the hero split
  collapses to one column below `lg`.
- Keyboard: the board is a proper `radiogroup` — arrow keys move between cells,
  Enter/Space selects, visible 2px cyan focus ring on every cell.
- Contrast: silver-300 `#C7CEDB` on `ucl-900` is ~9:1; silver-500 `#8B95A9` is
  ~4.6:1 and is used only for meta text above 14px.
- `.ucl-cut` is reduced to **three** uses — the hero board, the VIP ladder, the
  footer panel — so the facet reads as structure again.
- Skip link, `<title>`/meta per locale, landmark elements, `lang`/`dir` honoured
  for the Arabic locale.

---

## 8. Fix first, before any design work

| # | Fix | File |
|---|-----|------|
| 1 | Remove the `background: #06101F` wrapper and the inline `style` prop injected into every page component | `pages/_app.js` |
| 2 | Move the Google font `@import`s above the `@tailwind` directives, or delete them and load the two families via `next/font` | `styles/globals.css` |
| 3 | Set `body { background: #000A1E }` so nothing inherits the old `#10284D` | `styles/globals.css` |
| 4 | Give the agents panel `id="agents"`, or repoint the nav item | `components/ucl/UclRewards.tsx` |
| 5 | Replace the four placeholder social links (`href="#contact"`) with real URLs, or remove the row | `components/ucl/UclFooter.tsx` |

---

## 9. Build order

1. Foundations — fixes 1–3, font loading, `body` background.
2. `styles/ucl.css` — add Archivo/Barlow families, the two functional result
   tokens, and reduce `.ucl-cut` to its three call sites.
3. Hero — the interactive board. This is the risky, high-value piece; build and
   verify it on its own before going further.
4. Ticker + markets tabs (reusing the board mechanic).
5. How it works → rewards ladder → trust → FAQ accordion.
6. CTA + footer.
7. Locale pass — new copy needs keys in all seven `locales/*/common.json`, and
   `ar` needs RTL verified.

---

## 10. Open questions

- **Tournament framing.** Sections currently reference Champions League fixtures
  (Real Madrid v Manchester City) as marketing copy. Confirm this is intended
  rather than placeholder, given the product sells its own verified fixtures.
- **Agent/commission content.** The landing carries a three-tier agent rebate
  table and salary levels. Confirm this stays on the public page — it is a large
  block of the page's current length.
- **Locale coverage.** Seven languages are wired up. Any new marketing copy needs
  translation before it can ship to the non-English audiences, which is most of
  the target market.
