You are a senior product designer and front-end engineer. Your job is to audit and rebuild the landing page described below. Treat this as a precision refactor, not a redesign: preserve all copy, brand colours, logo, and section order. Change only what violates the rules that follow. Do not add sections, remove sections, or invent content.

STEP 1 — AUDIT FIRST
Before writing any code, list every violation you find under these headings: Layout & Proportion, Typography, Spacing, Imagery, Motion, Accessibility, Responsive. Output that list, then fix every item on it. Do not skip the audit.

LAYOUT & PROPORTION
- Use one container: max-width 1200px, 24px gutters on mobile, 40px on tablet, centred on desktop. Content must never touch the viewport edge.
- Build on a 12-column grid with 24px gutters. Every block must align to it.
- All spacing, padding, margin and sizing must be a multiple of 8px (4px allowed for icon gaps only). No arbitrary values like 13px or 27px.
- Vertical rhythm: minimum 96px between desktop sections, 64px tablet, 48px mobile. Adjoining sections must not fight — never 200px above and 20px below the same heading.
- Fix every visual imbalance. If a hero is split 50/50, both columns must carry equal optical weight. If images in a row differ in height, either match them with fixed aspect ratios and object-fit: cover, or use a deliberate masonry pattern — never accidental misalignment.
- The hero must fit inside the viewport at 1440x900 without clipping the headline or the CTA.
- No horizontal scrollbars at any width from 320px to 2560px.

TYPOGRAPHY
- Two font families maximum. One type scale only: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px.
- Body text 16-18px, line-height 1.5-1.6, measure 60-75 characters. Never full-width paragraphs.
- Headings: line-height 1.1-1.25, letter-spacing -0.02em at 48px and above.
- Never more than three font weights. Never all-caps for anything longer than a short label.
- Text must never sit on a busy image area without a scrim, and contrast must survive that scrim.

COLOUR & CONTRAST
- Body text contrast ratio at least 4.5:1; large text and UI borders at least 3:1. Verify this, do not assume it.
- One accent colour, used sparingly. No more than one accent CTA per screenful.
- No pure #000 on #FFF. No low-opacity grey text that falls below 4.5:1.

IMAGERY — QUALITY AND ARRANGEMENT
- Replace every low-resolution, stretched or blurry asset with a high-resolution source at least 2x its rendered display size. If no better asset exists, say so rather than guessing.
- Every image needs a fixed aspect ratio declared in CSS (e.g. aspect-ratio: 16/9) with object-fit: cover and object-position tuned so the subject is not cropped. Never squash or stretch.
- Set explicit width and height attributes to prevent layout shift. Lazy-load everything below the fold; eager-load the hero image.
- Serve modern formats (AVIF/WebP) with correct srcset and sizes so mobile never downloads desktop-sized files.
- Crops must preserve subjects: faces and product tops are never cut off. Keep treatment consistent across a row — same aspect ratio, same corner radius, same shadow.
- Icons must come from one set with one stroke weight, and be optically sized, since small icons read larger than they measure.
- No decorative image may compete with the CTA. No stock-photo collages.

MOTION & ANIMATION
- Motion must be purposeful and subtle. Use 150-300ms durations, ease-out for entry, ease-in for exit. Never linear on UI transitions.
- Animate only transform and opacity. Never animate width, height, top, left or box-shadow.
- Scroll reveals: 12-20px translate plus fade, staggered 60-80ms, triggered once only, never replaying when scrolling back up.
- Hover states must be immediate and small: a 2-4px lift or subtle scale plus a colour shift. No bouncing, no rotating, no parallax on text.
- No autoplaying carousels, no infinite loops, no attention-seeking animation anywhere near the CTA.
- Respect prefers-reduced-motion: reduce. Disable transforms and keep opacity fades only.
- Everything must hold 60fps on a mid-range phone. If it drops frames, remove the animation.

FORMS & CTAs (only where they exist)
- One primary CTA per section. Secondary actions are ghost or outline buttons and never carry competing visual weight.
- Inputs: 44px minimum height, 16px font to prevent iOS zoom, a visible label above each field, and specific error text adjacent to the field.

ACCESSIBILITY & INTERACTION
- Visible focus ring on every interactive element: 2px, 2px offset, 3:1 contrast.
- Touch targets at least 44x44px with 8px between them.
- Semantic HTML: one h1, ordered headings, header/nav/main/footer landmarks, alt text describing function, empty alt for decorative images.
- Buttons are buttons, links are links. CTA labels begin with a verb.
- Test at 200% zoom. Nothing may overlap or clip.

RESPONSIVE
- Design mobile-first at 360px, then verify 768px, 1024px and 1440px, plus 320px as the floor.
- Stack columns below 768px. Never shrink text below 16px to make it fit.
- Tap targets and the hero CTA must be reachable and above the fold on a 360x640 screen.

PERFORMANCE
- Target LCP under 2.5s and CLS under 0.1. Preload the hero image and primary font; use font-display: swap.
- No layout shift from late-loading fonts, images or injected banners.

DELIVERABLE
Return the complete, runnable code. Then return a checklist confirming each rule above, marking any rule you could not satisfy and explaining why. Do not summarise what you did — show the relevant code and the checklist.
