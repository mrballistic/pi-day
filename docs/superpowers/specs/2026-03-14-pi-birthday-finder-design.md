# Pi Day Birthday Finder — Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Stack:** Next.js 15 · MUI v6 · Framer Motion · canvas-confetti

---

## Overview

A single-page web app where users enter their birthday and watch a dramatic sci-fi scanner race through 1 million digits of π to find it. Three phases: input → scan animation → celebration reveal.

---

## Architecture

### State Machine

Single page (`page.tsx`) owns a `phase` state: `'input' | 'scanning' | 'result'`. Framer Motion `AnimatePresence` drives transitions between phases. No routing needed.

### Data Flow

```
piLoader.ts  ──fetch──▶  /public/pi-digits.json (1M digit string)
                                │
searchStrategies.ts  ◀──Date──  usePiSearch.ts  ──▶ { position, matchType, matchStr }
                                │
useScanAnimation.ts  ◀──────────┘  (receives match position, owns 4–8s cosmetic timeline)
                                │
DigitStream.tsx  ◀── visualPosition, speed, animPhase ──▶ renders RAF-driven digit scroll
```

All logic lives in hooks and lib. Components are purely presentational.

### Pi Digit Data

- **Source:** `scripts/download-pi.js` — Node.js script that fetches from pi2e.ch
- **Validation:** Assert `digits.startsWith("14159265358979323846")` before writing
- **Output:** `public/pi-digits.json` → `{ "digits": "14159265..." }` (≈1MB, ~450KB gzipped)
- **Loading:** Async fetch on mount via `piLoader.ts`, cached in a React ref; shows pulsing π until ready
- **Error state:** "Looks like π is being irrational today." + retry button

---

## Project Structure

```
pi-birthday-finder/
├── public/
│   └── pi-digits.json
├── scripts/
│   └── download-pi.js          # Run once: node scripts/download-pi.js
├── src/
│   ├── app/
│   │   ├── layout.tsx           # ThemeProvider, CssBaseline, Inter + JetBrains Mono fonts
│   │   ├── page.tsx             # Phase state machine + AnimatePresence
│   │   └── globals.css          # CSS custom props, @keyframes
│   ├── components/
│   │   ├── BirthdayInput.tsx    # Phase 1: DatePicker + CTA
│   │   ├── ScanAnimation.tsx    # Phase 2: orchestrates digit stream + trivia + progress
│   │   ├── DigitStream.tsx      # RAF-driven scrolling digit rows with scan cursor
│   │   ├── PiTriviaTicker.tsx   # Fixed bottom bar, AnimatePresence cross-fade every 3s
│   │   ├── ResultCard.tsx       # Phase 3: glassmorphism card, animated counter, share
│   │   ├── ConfettiExplosion.tsx # canvas-confetti dynamic import wrapper
│   │   └── FloatingDigits.tsx   # Ambient background digit particles (CSS animation)
│   ├── hooks/
│   │   ├── usePiSearch.ts       # indexOf search, returns { position, matchType, matchStr }
│   │   └── useScanAnimation.ts  # RAF loop, speed ramp: slow→fast→homing, emits visualPosition
│   ├── lib/
│   │   ├── piLoader.ts          # fetch + cache pi digits
│   │   ├── searchStrategies.ts  # Date → priority-ordered search strings
│   │   ├── piTrivia.ts          # 20+ verified facts, Fisher-Yates shuffle
│   │   └── funFacts.ts          # Position-based fun fact generator
│   └── theme/
│       └── theme.ts             # MUI dark theme, neon palette overrides
```

---

## Phase Details

### Phase 1 — Birthday Input

- Deep space gradient background (`#0a0a1a → #1a1a2e → #16213e`) with `FloatingDigits` ambient particles
- Giant π hero (200px+), CSS `@keyframes` breathing glow cycling neon blue → purple → pink
- MUI `DatePicker` with custom dark theme; no future dates
- "Search π" pill button: gradient electric blue → violet; disabled until valid date; hover scale 1.05x

### Phase 2 — Scan Animation

- **DigitStream:** `requestAnimationFrame` loop renders a rolling window of π digits in multiple rows (6–8 desktop, 2–3 mobile). JetBrains Mono. All rows scroll together showing the same position window, with each row displaying a ~60-80 digit slice of the π string centered on `visualPosition`. The highlighted digit (neon green `#39ff14`) is always at a fixed column ~60% from the left — the cursor position. Rows are offset by a small stagger (e.g., row N shows digits starting at `visualPosition + N*3`) for visual variety while staying coherent.
- **Near-miss flashes:** `useScanAnimation` samples the real π digit string at `visualPosition` on each tick and checks if any search string prefix (2+ chars) matches the digits at that position. When a 2+ char prefix match is found, it emits a `nearMiss` flag with the matching length. `DigitStream` renders those digits in gold for 300ms. This is real-data-driven — no artificial injection needed since the π digits are available client-side.
- **Scan cursor:** Vertical neon cyan line, `box-shadow: 0 0 20px cyan`, sweeps left-to-right via `transform: translateX()`
- **Speed ramp:** `useScanAnimation` phases — `slow` (0–15% of duration, ~50 digits/frame-equivalent), `fast` (15–80%, digits blur past), `homing` (80–100%: visual speed decelerates to near-stop, cursor settles at center-left, visual position advances to land on the exact match region by end of animation). At the end of `homing`, the match digits are centered on screen, then the animation ends and Phase 3 begins.
- **Duration:** Always 4–8 seconds. Very early matches pad the animation; very late matches compress it.
- **Progress:** MUI `LinearProgress` + "Scanning digit N of 1,000,000" counter (bottom-left)
- **PiTriviaTicker:** Fixed bar above progress. Facts from shuffled `PI_TRIVIA` array. `AnimatePresence` vertical-slide + fade every 3s. `aria-live="polite"`. Minimum 2 facts per scan — animation padded if needed. Stops/fades on Phase 3 transition. `prefers-reduced-motion`: instant swap, no slide.

### Phase 3 — Celebration & Result

- **Digit stream freeze & flash:** At the end of the homing phase, `DigitStream` receives a `matchReveal` prop. It switches from the RAF rolling-window renderer to a static DOM snapshot: a single `<div>` of `<span>` elements, one per digit, for the ~40-digit window around the match. This allows CSS/Framer Motion to target individual digit spans. The matched spans flash 3× (white → gold → white via `@keyframes`), scale to 2× with gold `text-shadow`, while surrounding spans transition opacity to 20%. All via CSS on individual `<span>` elements — no canvas needed.
- `canvas-confetti` explosion (gold, cyan, magenta, white) — dynamically imported
- Background shifts to radial gradient burst
- Result card slides up after 1.5s:
  - Glassmorphism: `backdrop-filter: blur(20px)`, border glow, 16px radius
  - "Your birthday appears at position N in π!" with animated counter 0→N
  - ~40-digit context strip, match highlighted gold
  - Match type badge: 🌟 Full Date Match (gold) / 🎂 Month+Day Match (cyan) / 🔍 Partial Match (silver)
  - Fun fact from `funFacts.ts` based on position
  - Share button: copies "My birthday is hiding at position N in π! Find yours at [URL] #PiDay" where `[URL]` is `window.location.href` at click time — toast confirmation
  - "Try Another Birthday" resets to Phase 1

---

## Search Strategy

```typescript
// Priority order for July 4, 1990:
// 1. "07041990"  MMDDYYYY  → 🌟 Full Date Match
// 2. "04071990"  DDMMYYYY  → 🌟 Full Date Match (Intl)
// 3. "0704"      MMDD      → 🎂 Month+Day Match
// 4. "070490"    MMDDYY    → 🎂 Date Match (Short Year)
// 5. "74"        MD (no zero-padding, single digit month + single digit day) → 🔍 Partial Match

// Priority 5 is always a 2-character string: String(month) + String(day), no padding.
// For July 4: month=7, day=4 → "74"
// For January 9: month=1, day=9 → "19"
// For October 31: month=10, day=31 → search falls back to MMDD "1031" (already covered by priority 3)
// Priority 5 only applies when both month and day are single digits (month 1–9, day 1–9).
```

`String.prototype.indexOf()` on 1M chars — effectively instant. Match guaranteed within 1M digits at 2-digit granularity.

---

## funFacts.ts — Position-Based Fun Fact Generator

`funFacts.ts` exports a single function `getFunFact(position: number): string`. It maps position ranges to fact templates:

```typescript
// position 1–10,000 (top 1%):   "That's in the first 1% of π — your birthday is practically at the start!"
// position 10,001–50,000:        "That's {pct}% of the way through the first million digits."
// position 50,001–200,000:       "Further than most humans have ever memorized!"
// position 200,001–500,000:      "You'd need to memorize π to {position.toLocaleString()} digits to reach your birthday."
// position 500,001–900,000:      "Hiding deep — in the second half of the first million digits."
// position 900,001–1,000,000:    "Almost at the very end — your birthday is in the last {remaining} digits!"
// No match in first 1M:           "Your birthday is beyond the first million digits — truly hidden in π!"
```

`pct` = `Math.round((position / 1_000_000) * 100 * 10) / 10` (one decimal place). `remaining` = `1_000_000 - position`.

---

## Position Counter Animation

The result card counter animates from 0 to `position` over **1.2 seconds** with an ease-out curve, implemented via Framer Motion's `useMotionValue` + `useTransform`, or a simple `requestAnimationFrame` loop in a `useEffect`.

---

## Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a1a` | Page background |
| `--neon-blue` | `#00d4ff` | Primary accent, scan cursor |
| `--neon-purple` | `#b24bff` | Gradient secondary |
| `--neon-pink` | `#ff2d95` | Gradient tertiary |
| `--neon-green` | `#39ff14` | Active scan position |
| `--gold` | `#ffd700` | Match highlight, celebration |
| `--text-muted` | `#8892b0` | Trivia ticker, labels |

Fonts: Inter (body/UI) + JetBrains Mono (digits). Loaded via `next/font/google`.

---

## Responsive Breakpoints

| Breakpoint | Digit rows | Result card | Trivia ticker | π hero |
|-----------|-----------|-------------|---------------|--------|
| Mobile <600px | 2–3 | Full-width | 40px / 14px | 120px |
| Tablet 600–960px | 4–5 | 80% width | 48px / 16px | 160px |
| Desktop 960px+ | 6–8 | Centered | 48px / 16px | 200px+ |

---

## Accessibility

- `aria-live` regions: "Scanning digits of pi..." (Phase 2), "Match found at position N" (Phase 3)
- `PiTriviaTicker`: `aria-live="polite"`
- `prefers-reduced-motion`: instant phase transitions, no RAF animation (show result after brief pause), trivia swaps without motion
- All interactive elements keyboard-navigable; visible focus indicators
- WCAG AA contrast on all text

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| No 8-digit match | Fall through priority list; 2-digit match guaranteed |
| Feb 29 birthday | Accept; search doesn't validate leap year |
| Pi digits fail to load | "π is being irrational today" error + retry button |
| Match at digit < 100 | Still run full 4–8s animation |
| Short scan < 6s | Pad animation to show minimum 2 trivia facts |
| Rapid re-search | Search button disabled during animation; Try Again only after Phase 3 |

---

## Build Sequence

1. Project init (`create-next-app`) + dependency install
2. `scripts/download-pi.js` → `public/pi-digits.json`
3. MUI theme (`theme.ts`)
4. Root layout + global CSS
5. Core logic: `piLoader.ts`, `searchStrategies.ts`, `piTrivia.ts`
6. Hooks: `usePiSearch.ts`, `useScanAnimation.ts`
7. Phase 1: `BirthdayInput.tsx` + `FloatingDigits.tsx`
8. Phase 2: `DigitStream.tsx` + `PiTriviaTicker.tsx` + `ScanAnimation.tsx`
9. Phase 3: `ResultCard.tsx` + `ConfettiExplosion.tsx` + `funFacts.ts`
10. Main page orchestration (`page.tsx`)
11. Responsive polish + accessibility audit
12. `npm run build && npm start`

---

## Out of Scope

- Vercel deployment (local build only; deploy separately)
- Web Audio API sound effects
- Social OG image generation
- Leaderboard / analytics
- Multi-language i18n
