---
name: UCL Matchday Bulletin
description: A compact, readable football bulletin for matches, markets, and bet records.
colors:
  bulletin-blue: "#00409e"
  bulletin-blue-deep: "#002d72"
  bulletin-ink: "#080f32"
  bulletin-muted: "#536583"
  bulletin-line: "#dce4f2"
  white: "#fff"
  hover-paper: "#f4f8ff"
  header-paper: "#f4f7fc"
  quiet-paper: "#f1f4fb"
  blue-paper: "#eaf0fb"
  selection-paper: "#cfe1ff"
  protected-paper: "#fff0f7"
  protected-ink: "#a90059"
  won-paper: "#e8f5ec"
  won-ink: "#216e42"
  lost-paper: "#fbecee"
  lost-ink: "#a43d4a"
  pending-paper: "#fbf2dc"
  pending-ink: "#805810"
  native-paper: "#F8FAFF"
  native-body: "#293E60"
  native-outline: "#667895"
  native-error: "#9A1B1B"
  native-dark-primary: "#8DB8FF"
  native-dark-secondary: "#FF8AC4"
  native-dark-on-secondary: "#4B002B"
  native-dark-tertiary: "#7CEBFF"
  native-dark-ground: "#000A1E"
  native-dark-surface: "#091B34"
  native-dark-variant: "#10284D"
  native-dark-ink: "#F2F5FA"
  native-dark-muted: "#D4DEEF"
  native-dark-outline: "#8293B0"
  native-dark-error: "#FFB4AB"
typography:
  headline:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  market-title:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 750
    lineHeight: 1.5
  section-title:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  body:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  team:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.5
  label:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "12px"
    lineHeight: 1.5
  odds:
    fontFamily: "Inter, 'DM Sans', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 700
  native-headline:
    fontFamily: "Inter"
    fontSize: "28sp"
    fontWeight: 700
    lineHeight: "36sp"
rounded:
  badge: "4px"
  control: "6px"
  field: "8px"
  surface: "12px"
  sheet-top: "20px"
spacing:
  xsmall: "4px"
  small: "8px"
  team-gap: "10px"
  compact: "12px"
  medium: "16px"
  row: "20px"
  large: "24px"
  xlarge: "32px"
  page-bottom: "48px"
components:
  action:
    backgroundColor: "{colors.bulletin-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  stake-submit:
    backgroundColor: "{colors.bulletin-blue}"
    textColor: "{colors.white}"
    padding: "10px 16px"
    height: "48px"
  stake-submit-hover:
    backgroundColor: "{colors.bulletin-blue-deep}"
    textColor: "{colors.white}"
  back:
    textColor: "{colors.bulletin-blue}"
    height: "44px"
  bulletin-surface:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.surface}"
  score-cell:
    backgroundColor: "{colors.white}"
    textColor: "{colors.bulletin-ink}"
    padding: "16px"
    height: "80px"
  score-cell-selected:
    backgroundColor: "{colors.blue-paper}"
  score-cell-unavailable:
    backgroundColor: "{colors.quiet-paper}"
    textColor: "{colors.bulletin-muted}"
  score-cell-protected:
    backgroundColor: "{colors.protected-paper}"
  status-won:
    backgroundColor: "{colors.won-paper}"
    textColor: "{colors.won-ink}"
    rounded: "{rounded.badge}"
    padding: "5px 8px"
  financial-total:
    backgroundColor: "{colors.blue-paper}"
    textColor: "{colors.bulletin-blue}"
    rounded: "{rounded.control}"
    padding: "16px"
---

# Design System: UCL Matchday Bulletin

## Overview

**Creative North Star: "Matchday Bulletin"**

A clear football bulletin built for fast scanning: bold sans headings, light surfaces, blue section markers, thin separators, and aligned figures. Hierarchy comes from type, spacing, and columns. Fixture and bet information stays readable when names, translations, or amounts become longer.

This record describes the user-approved Matches, match markets and stake entry, My Bets, and bet-detail surfaces on the React website and Kotlin Compose Android app. It does not replace the visual identity of the landing page, account, wallet, referral, VIP, or administration experiences. UCL is the confirmed public name; this surface direction is not a new product slogan. Per-surface composition is recorded in `.impeccable/surfaces/matchday-bulletin.md`.

**Key Characteristics:**
- Compact information rows with meaningful separators.
- Bold sans hierarchy and explicit textual states.
- Blue navigation, odds, section rules, and selection emphasis.
- Responsive numerical columns and readable local dates.
- English and Burmese copy with MMK financial values.

This is a source-derived record. Browser recapture is pending after the Chrome connection was lost; native visual verification is pending because the emulator could not load the app. No visual validation pass is claimed.

## Colors

The web palette combines deep blue information markers, navy text, pale cool surfaces, and restrained semantic state colors. The frontmatter owns exact values.

### Primary

- **Bulletin Blue:** back links, odds, active tabs, section dividers, primary actions, selection outline, and focus outlines. The deeper companion is implemented for the stake-submit hover state.
- **Blue Paper:** selected markets, tab counts, refunded badges, and financial totals; **Selection Paper** marks selected text.

### Secondary

- **Protected Ink / Protected Paper:** company-game and protected-market information on the web. Protection remains a text label alongside color.
- **Won, Lost, and Pending pairs:** outcome badges. Refunded uses the primary blue pair; not-started uses quiet paper and muted text. Ongoing and processing use the pending pair.

### Neutral

- **Bulletin Ink:** fixtures, picks, and main figures. **Bulletin Muted:** labels, league/kickoff metadata, and explanatory text.
- **White:** web lists, sections, market cells, and stake drawer. **Bulletin Line:** container borders and row separators. **Hover Paper:** actionable row hover. **Header Paper:** ledger column headings. **Quiet Paper:** unavailable cells and loading placeholders.

### Native role mapping

Compose uses `MaterialTheme.colorScheme` and system dark mode rather than forcing white on every surface. The explicit light roles in `UclTheme.kt` are: primary = Bulletin Blue; onPrimary/background/surface = Native Paper; onBackground/onSurface = Bulletin Ink; secondary = Protected Ink; onSecondary = White; surfaceVariant = Quiet Paper; onSurfaceVariant = Native Body; outline = Native Outline; error = Native Error.

The explicit dark roles are: primary = Native Dark Primary; onPrimary = Bulletin Blue Deep; secondary/onSecondary = Native Dark Secondary/Native Dark On Secondary; tertiary = Native Dark Tertiary; background = Native Dark Ground; surface = Native Dark Surface; surfaceVariant = Native Dark Variant; onBackground/onSurface = Native Dark Ink; onSurfaceVariant = Native Dark Muted; outline = Native Dark Outline; error = Native Dark Error. These are native theme roles, not an additional web accent palette. The theme leaves container and outlineVariant roles to Material defaults; their resolved colors are not invented here.

**The Explicit State Rule.** Always pair outcome, unavailable, and protected color treatments with their existing translated labels.

## Typography

The web page stack is Inter, DM Sans, Arial, sans-serif. Inter and Arial are used in the stake drawer. Compose bulletin headings and teams explicitly use the bundled `WebInter`; general labels and descriptions use Material typography or explicit sizes.

### Hierarchy

- **Headline:** the web page headline and prominent pick share the strong 32px role; page headlines reduce to 28px on phones. Market fixture titles use 28px and reduce to 22px.
- **Title:** market section titles use the market-title role and reduce to 20px on phones. Bordered section headings use the section-title role.
- **Body / team:** descriptions use the body role; team names use the team role. Descriptions have a 65ch maximum where implemented; team names can wrap.
- **Label / odds:** labels stay muted and smaller than the figures they identify. Market scores use 20px bold; odds use the odds role. Ledger amounts and facts retain stronger weight than their labels.
- **Native:** bulletin headings use the native-headline role; section headings use 18sp bold; team names use 14sp semibold or 20sp when large; facts use 12sp labels and 14sp semibold values. Material bodyMedium is 14sp/21sp.

**The Figure Alignment Rule.** Web bulletin pages use tabular numerals. Preserve aligned financial values and the end alignment of fact values; never flatten stake, profit, and returned stake into one unlabeled figure.

The global native theme still declares serif display/headline/title roles. Bulletin headings override them with Inter; the serif defaults are not the Matchday Bulletin heading system.

## Layout

The web content is centered at a maximum width of 1120px, with 12px top and 48px bottom padding inside its existing shell. Desktop fixture rows have league/time, teams, three preview figures, and a trailing arrow, with 24px gaps and 20px by 24px row padding. Blue section rules are 2px; internal dividers and borders are 1px.

At 900px and below, fixtures tighten their gaps and padding; the score matrix changes from three columns to two. The ledger hides its header and puts the fixture above three labeled numerical cells. At 620px and below, fixtures stack their metadata, teams, and preview; summaries become two by two; ledger figures become two columns; detail sections stack; padding tightens to 20px by 16px. At 360px and below, market cells stack score and odds internally.

At 1100px and above, an open stake drawer sits on the right at 380px, beginning below the shell's 80px header. The page reserves 404px, including the 24px gap. Below 1100px, stake entry is a centered bottom drawer up to 560px wide, at most 92dvh, with safe-area-aware bottom padding. The phone form is the same stake journey.

Compose uses vertically scrolling lists with 16dp horizontal insets; its score matrix has two equal columns and market cells at least 92dp high. My Bets metrics use two by two; detail facts align label and value in equal-weight columns. Native stake entry uses `ModalBottomSheet` with a 20dp top shape and scrolling content. Native layout uses dp/sp, not web pixel breakpoints.

## Elevation & Depth

Bulletin lists, summaries, market matrices, and detail sections are flat: thin borders, white or theme surfaces, and tonal state fills carry their hierarchy. Do not inherit unrelated card shadows into these surfaces. The selected web score cell has an inset 2px blue outline; keyboard focus uses a 3px blue outline with 3px offset, inset on rows and cells. Stake drawers and native sheets retain their framework overlay behavior; no custom shadow value was extracted.

## Shapes

The surface shape is a gently rounded 12px container, shared by fixture lists, ledgers, summaries, hero panels, and detail sections; Compose bulletin sections use 12dp. Small badges use 4px and controls/totals use 6px. Stake inputs use 8px. Phone drawers and native bottom sheets have 20px/dp top corners. Market cells form one divided matrix rather than individually rounded cards.

## Components

### Navigation and actions

Back links are blue inline controls with a minimum 44px web height; native back buttons use a minimum 48dp height. Web retry/browse actions use the action token. The stake submit button is 48px minimum, blue, white-text, and deepens on hover. Preserve the visible keyboard outlines and tab keyboard navigation.

### Fixture row and bulletin surface

Fixture lists and ledger containers share the surface shape and thin border. Rows have a subtle cool hover fill. Team crests support names; names remain visible when images are absent. Date groups and blue rules organize information without decorative imagery.

### Score matrix

The web cell uses score on the left and labeled odds on the right. Selected cells use blue paper plus the inset outline, unavailable cells are disabled with quiet paper and muted text, and protected cells use the protected pair and label. Compose uses surface/surfaceVariant/primaryContainer for available/unavailable/protected cells. Native selected cells retain primaryContainer and a 2dp primary border when the stake sheet opens; selection is saved per match ID. Cells expose selected semantics and the Button accessibility role, while unavailable cells remain non-interactive.

### My Bets tabs and outcome badges

Two count-bearing tabs separate unsettled and settled records. Web active tabs have a 3px blue bottom rule; count badges use blue paper. Their roving tab stop follows selection: ArrowLeft/ArrowRight switch categories, Home selects unsettled, and End selects settled. The ledger panel names its active tab. Outcomes carry translated text and semantic fill. Native uses Material `TabRow` and `Tab` with the same two categories. Ledger return labels remain visible on desktop as well as smaller layouts, so returned stake and potential return retain their meaning in every numerical column.

### Stake field and financial facts

The stake input is decimal-oriented with a translated accessible label, white background, and a minimum 48px height. Its current one-off border and legacy Arial styles are implementation residue, not additional palette or typography rules. Financial facts use thin separators and right-aligned values. The final financial row has blue paper and stronger blue text. Refunded records label that row as returned stake, set displayed profit to zero, and show the refund explanation.

### Loading, empty, and failure states

Web placeholders use quiet paper, while empty/error states use bordered surfaces and plain-language translated explanations. Retry is an explicit action. Refresh failures with existing content retain that content and present a notice. Bet-detail content is keyed to the requested bet ID; changing routes shows the new loading state rather than the previous bet's details. Native uses matching content-preserving state behavior with Material surfaces and colors.

## Do's and Don'ts

### Do:

- **Do** keep this direction scoped to the four documented betting surfaces.
- **Do** preserve the blue section markers, thin separators, bold sans hierarchy, and labeled numerical columns.
- **Do** allow English and Burmese labels and long team names to wrap without hiding their meaning.
- **Do** keep local kickoff dates, translated state labels, and MMK financial formatting explicit.
- **Do** preserve native light/dark Material roles and web keyboard focus treatment.
- **Do** distinguish refunded stake from profit and potential return.

### Don't:

- **Don't** infer a new product identity or redesign unrelated surfaces from this scoped record.
- **Don't** use outcome or market protection color as the only state cue.
- **Don't** promote native inherited container colors, serif defaults, or the stake field's one-off border into new bulletin tokens.
- **Don't** claim browser or emulator visual validation until recapture succeeds.
