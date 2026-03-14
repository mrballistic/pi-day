# CLAUDE.md

## Project: Pi Day Birthday Finder

A flashy single-page app that finds the user's birthday in the digits of π, with a dramatic scanning animation and celebration reveal. Users enter their birthday, watch a sci-fi digit scan, and discover exactly where their birthday hides in π.

## Stack

- Next.js 15 (App Router, TypeScript, `src/` directory)
- MUI v6 (`@mui/material`, `@mui/x-date-pickers`) with Emotion
- Framer Motion for transitions and `AnimatePresence` phase switching
- `canvas-confetti` for celebration effects (dynamically imported)
- Google Fonts: Inter (body) + JetBrains Mono (digits)
- `date-fns` for date adapter

## Init Commands

```bash
npx create-next-app@latest pi-birthday-finder --typescript --app --src-dir --tailwind=false --eslint --import-alias "@/*"
cd pi-birthday-finder
npm install @mui/material @mui/x-date-pickers @emotion/react @emotion/styled framer-motion canvas-confetti date-fns
npm install -D @types/canvas-confetti
```

## Pi Digit Data

- Download first 1M digits of pi (after decimal) as a single string
- Save to `public/pi-digits.json` as `{ "digits": "14159265..." }`
- Validate: string must start with `"14159265358979323846"`
- Source: Use a reliable pi digit source — write a generation script or fetch from https://pi2e.ch/blog/2017/03/10/pi-digits-download/
- If network is unavailable, generate using a pi computation library or embed the digits directly

## Project Structure

```
pi-birthday-finder/
├── public/
│   └── pi-digits.json
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, ThemeProvider, font imports
│   │   ├── page.tsx              # Main page, orchestrates 3 phases
│   │   └── globals.css           # CSS custom properties, keyframes, base styles
│   ├── components/
│   │   ├── BirthdayInput.tsx     # Phase 1: date picker + CTA
│   │   ├── ScanAnimation.tsx     # Phase 2: digit scanning + trivia ticker
│   │   ├── ResultCard.tsx        # Phase 3: celebration + result display
│   │   ├── DigitStream.tsx       # Animated digit display (matrix-rain style)
│   │   ├── FloatingDigits.tsx    # Ambient background particle effect
│   │   ├── PiTriviaTicker.tsx    # Rotating pi fact ticker for Phase 2
│   │   └── ConfettiExplosion.tsx # canvas-confetti wrapper
│   ├── hooks/
│   │   ├── usePiSearch.ts        # Core search logic + match result
│   │   └── useScanAnimation.ts   # Animation timing + speed ramp logic
│   ├── lib/
│   │   ├── piLoader.ts           # Loads/caches pi digits from JSON
│   │   ├── searchStrategies.ts   # Birthday → search strings conversion
│   │   ├── piTrivia.ts           # Array of 20+ pi facts + shuffle utility
│   │   └── funFacts.ts           # Position-based fun fact generator
│   └── theme/
│       └── theme.ts              # MUI dark theme configuration
├── CLAUDE.md
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Build Order

1. Project init + dependency install
2. Pi digit data file (generate or download + validate first 20 known digits)
3. MUI theme (`src/theme/theme.ts`) — dark cosmic theme with neon accents
4. Root layout with ThemeProvider, CssBaseline, font setup (Inter + JetBrains Mono via `next/font/google`)
5. Global CSS: custom properties for colors, keyframe animations for pulsing/floating
6. Core search logic (`src/lib/searchStrategies.ts`, `src/lib/piLoader.ts`)
7. Pi trivia data (`src/lib/piTrivia.ts`) — 20+ facts with Fisher-Yates shuffle
8. Phase 1: `BirthdayInput` component (MUI DatePicker, neon styling, CTA button)
9. Phase 2: `ScanAnimation` + `DigitStream` + `PiTriviaTicker` components
10. Phase 3: `ResultCard` + `ConfettiExplosion` components
11. `FloatingDigits` background particle component
12. Main page orchestration (`page.tsx` — phase state machine with AnimatePresence)
13. Fun facts generator (`src/lib/funFacts.ts`)
14. Responsive polish + accessibility audit
15. Final build test: `npm run build && npm start`

## Phase Details

### Phase 1 — Birthday Input
- Dark cosmic background gradient: `#0a0a1a` → `#1a1a2e` → `#16213e`
- Giant π symbol with CSS pulsing glow animation, color cycles neon blue/purple/pink
- Headline: "Find Your Birthday in π" — white, bold, text-shadow glow
- Subheadline: "Every birthday is hiding somewhere in the infinite digits of pi. Let's find yours."
- MUI DatePicker with dark theme, neon focus borders
- No future dates allowed
- "Search π" pill button: gradient electric blue → violet, hover scale 1.05x, disabled until valid date

### Phase 2 — Scan Animation
- Digit stream: JetBrains Mono, multiple rows scrolling right-to-left, semi-transparent white digits
- Current position highlighted in neon green (`#39ff14`)
- Vertical scan cursor: glowing cyan line sweeping left-to-right, `box-shadow: 0 0 20px cyan`
- Progress counter bottom-left: "Scanning digit N of 1,000,000" with MUI LinearProgress
- Near-miss flashes: partial matches flash gold briefly
- **Speed ramp:** slow start (~50 digits/sec visual) → blur speed mid-scan → dramatic slowdown within 200 digits of match
- **Duration: 4–8 seconds regardless of actual match position** — decouple visual pace from real search
- **Pi Trivia Ticker:** fixed bar at bottom, above progress counter. Semi-transparent dark bg (`rgba(10,10,26,0.85)`), neon blue top border. Facts cross-fade every 3 seconds via Framer Motion AnimatePresence (vertical slide + fade). Minimum 2 facts shown per scan. "π" prefix icon before each fact. Stops when match found.
- Use `requestAnimationFrame` for digit stream — not CSS animation — for precise speed control

### Phase 3 — Celebration
- Digit stream freezes, matched digits flash 3x (white → gold → white)
- Matched digits scale 2x with gold glow, surrounding digits fade to 20% opacity
- `canvas-confetti` explosion: colors gold, cyan, magenta, white
- Background shifts to radial gradient burst
- Trivia ticker fades out
- Result card slides up after 1.5s:
  - Glassmorphism: `backdrop-filter: blur(20px)`, border glow, 16px radius
  - "Your birthday appears at position [N] in π!" — animated counter 0→N
  - Digit context strip: ~40 digits centered on match, match highlighted gold, monospaced
  - Fun fact line based on position
  - Match type badge: "🌟 Full Date Match" (gold) / "🎂 Month+Day Match" (cyan) / "🔍 Partial Match" (silver)
  - Share button: copies "My birthday is hiding at position [N] in π! Find yours at [URL] #PiDay" to clipboard with toast
  - "Try Another Birthday" outlined button resets to Phase 1

## Search Strategy (searchStrategies.ts)

Given a Date, generate search strings in priority order and use the first match:

```typescript
// Priority order for July 4, 1990:
// 1. "07041990"  → MMDDYYYY  → "🌟 Full Date Match"
// 2. "04071990"  → DDMMYYYY  → "🌟 Full Date Match (Intl)"
// 3. "0704"      → MMDD      → "🎂 Month+Day Match"
// 4. "070490"    → MMDDYY    → "🎂 Date Match (Short Year)"
// 5. "74"        → MD        → "🔍 Partial Match"
```

Use `String.prototype.indexOf()` for the actual search — it's instant on 1M chars. The animation is purely cosmetic.

## Pi Trivia (piTrivia.ts)

Include 20+ verified facts. Shuffle with Fisher-Yates on each scan. Examples:

```typescript
export const PI_TRIVIA: string[] = [
  "π has been calculated to over 105 trillion digits — and counting.",
  "The first 144 digits of π add up to 666.",
  "Albert Einstein was born on Pi Day — March 14, 1879.",
  "π is irrational — its decimal representation never ends and never repeats.",
  "If you write π to 39 digits, you can calculate the circumference of the observable universe to within the width of a hydrogen atom.",
  "The probability that two random integers are coprime is 6/π².",
  "In 1897, an Indiana bill nearly legislated π to be 3.2. It failed.",
  "π appears in the equation for the normal distribution — the bell curve.",
  "The Feynman point — six consecutive 9s — begins at position 762 in π.",
  "Archimedes was the first to rigorously approximate π using 96-sided polygons.",
  "William Shanks calculated π to 707 places by hand in 1873. He was wrong after digit 527.",
  "March 14 at 1:59:26 is the most precise Pi Day moment — 3.1415926.",
  "π is transcendental — it cannot be the root of any polynomial with rational coefficients.",
  "The Greek letter π was first used for the ratio by William Jones in 1706.",
  "Buffon's needle problem: dropping needles on lined paper approximates π.",
  "There's a language called Pilish where each word length matches a digit of π.",
  "The ancient Egyptians approximated π as 3.1605 — remarkably close for 1650 BCE.",
  "In Star Trek's 'Wolf in the Fold,' Spock defeats a computer by asking it to compute π to the last digit.",
  "The record for memorizing π is 70,030 digits, held by Suresh Kumar Sharma.",
  "If you search long enough in π, you can find any finite sequence of digits — including your phone number.",
];
```

Verify accuracy of all facts before including. Replace any disputed facts with safe mathematical facts.

## Theme Colors (CSS Custom Properties)

```css
:root {
  --bg-primary: #0a0a1a;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #16213e;
  --neon-blue: #00d4ff;
  --neon-purple: #b24bff;
  --neon-pink: #ff2d95;
  --neon-green: #39ff14;
  --gold: #ffd700;
  --text-primary: #ffffff;
  --text-muted: #8892b0;
}
```

## MUI Theme (theme.ts)

Dark mode. Override palette background to `--bg-primary`. Override primary color to neon-blue. Override MUI DatePicker popper and input styles for neon borders and dark backgrounds. Set typography fontFamily to Inter with JetBrains Mono as monospace fallback.

## Critical Requirements

- Scan animation MUST be 4–8 seconds regardless of match position
- Speed ramp: slow start → fast middle → dramatic slowdown near match
- **Trivia ticker cycles every 3 seconds during scan, minimum 2 facts per scan**
- **Trivia ticker uses Framer Motion AnimatePresence for cross-fade transitions**
- All animations respect `prefers-reduced-motion` (instant transitions, static displays, trivia swaps without motion)
- `canvas-confetti` must be dynamically imported (`next/dynamic` or dynamic `import()`)
- No future dates in date picker
- Share button uses `navigator.clipboard.writeText()`
- Mobile: digit stream 2–3 rows, result card full-width, trivia ticker 40px/14px
- Desktop: digit stream 6–8 rows, trivia ticker 48px/16px
- GPU-accelerated transforms only for animations (`transform`, `opacity`)
- `aria-live` regions for screen reader announcements during scan and on match
- Trivia ticker has `aria-live="polite"`

## Responsive Breakpoints

- **Mobile (<600px):** Stack vertical. Digit stream 2–3 rows. Full-width result card. π hero 120px. Trivia 40px height, 14px text, truncate ellipsis.
- **Tablet (600–960px):** Digit stream 4–5 rows. Result card 80% width. Trivia 48px height.
- **Desktop (960px+):** Full experience. Digit stream 6–8 rows. Generous spacing. Trivia 48px height, 16px text.

## Edge Cases

- No 8-digit match: fall through priority list. 2-digit match guaranteed in 1M digits.
- Feb 29 birthday: accept it, search doesn't care about leap year validity.
- Pi digits fail to load: show "Looks like π is being irrational today. Please refresh and try again." + retry button.
- Very early match (< digit 100): still run full 4–8 second animation.
- Rapid re-searches: disable Search button during animation. "Try Again" only after Phase 3 completes.
- Short scan (< 6 seconds): ensure minimum 2 trivia facts are shown — pad animation if needed.

## Testing Checklist

- [ ] Birthday Jul 4, 1990 → finds `0704` or `07041990`
- [ ] Birthday Jan 1, 2000 → finds `01012000` or `0101`
- [ ] Feb 29 birthday accepted
- [ ] Animation completes in 4–8 seconds
- [ ] Trivia ticker rotates facts every ~3 seconds during scan
- [ ] At least 2 trivia facts shown per scan
- [ ] Trivia ticker disappears on Phase 3 transition
- [ ] Confetti fires on match reveal
- [ ] Position counter animates from 0 to N
- [ ] Share button copies formatted text to clipboard
- [ ] Toast confirmation appears after share
- [ ] Mobile layout works at 375px width
- [ ] Trivia truncates with ellipsis on very narrow screens
- [ ] Reduced motion: no animation, instant result, trivia swaps without motion
- [ ] Pi digits load async, don't block render
- [ ] Loading indicator (pulsing π) shown while digits fetch
- [ ] `npm run build` succeeds with zero errors
- [ ] No console errors or warnings in browser
