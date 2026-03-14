# π Pi Day Birthday Finder — Product Requirements Document

**Author:** Todd Greco
**Date:** March 14, 2026
**Version:** 1.1
**Stack:** Next.js 15 + MUI 6 + Vercel
**Build Method:** Claude Code CLI (one-shot, `--dangerously-skip-permissions`)

---

## 1. Overview

A flashy, celebratory single-page web app that lets users enter their birthday and then watch as an animated scanner races through the digits of π to find the matching date string. While scanning, a rotating ticker of pi trivia keeps users entertained. Once found, the app erupts with confetti, particles, and a personalized celebration showing exactly where in π the user's birthday lives.

**Target Audience:** Anyone celebrating Pi Day — math enthusiasts, teachers, students, social media sharers.

**Deployment:** Vercel (static/SSR hybrid via Next.js App Router).

**Build Methodology:** PRD → Claude Code CLI one-shot autonomous build with `--dangerously-skip-permissions`.

---

## 2. Core User Flow

The app has three distinct phases, each with its own visual personality.

### 2.1 Phase 1 — Birthday Input

The landing screen. A dark, cosmic background with a giant animated π symbol pulsing gently. The user is greeted and asked to enter their birthday.

| Element | Specification |
|---------|--------------|
| **Background** | Deep space gradient (`#0a0a1a` → `#1a1a2e` → `#16213e`) with subtle floating digit particles (0–9) drifting slowly in the background. |
| **Hero π Symbol** | CSS-animated pulsing glow effect, 200px+ font size, color cycles through neon blue/purple/pink. Uses CSS `@keyframes` for a smooth breathing glow. |
| **Headline** | "Find Your Birthday in π" — large, bold, white text with subtle text-shadow glow. |
| **Subheadline** | "Every birthday is hiding somewhere in the infinite digits of pi. Let's find yours." — muted gray, elegant. |
| **Date Picker** | MUI DatePicker component with a dark-themed custom MUI ThemeProvider. Month/Day/Year selectors. Neon-bordered, glowing focus states. No future dates allowed. |
| **CTA Button** | "Search π" — large pill button, gradient fill (electric blue → violet), hover scales up 1.05x with box-shadow burst. Disabled until valid date entered. |

### 2.2 Phase 2 — The Scan Animation

This is the showpiece. When the user clicks "Search π", the screen transitions into a dramatic digit-scanning sequence. This phase must feel like a sci-fi computer cracking a code.

#### 2.2.1 Scanning Mechanics

1. The app loads the first 1 million digits of π from a static JSON file bundled in `/public`.
2. The birthday is converted to search strings. For a birthday of July 4, 1990, search for: `"07041990"` (MMDDYYYY, 8-digit), `"0704"` (MMDD, 4-digit), and `"74"` or `"741990"` as fallbacks.
3. The scan searches sequentially through the digits, prioritizing the longest match first (8-digit → 4-digit → shorter).
4. While scanning, the app displays a rolling window of π digits flying across the screen in a matrix-rain style animation.

#### 2.2.2 Visual Animation Spec

| Element | Specification |
|---------|--------------|
| **Digit Stream** | A monospaced font (JetBrains Mono or Fira Code via Google Fonts) displays digits scrolling rapidly from right to left across the screen in multiple rows. Digits are semi-transparent white, with the current scan position highlighted in bright neon green. |
| **Scan Cursor** | A vertical glowing line (neon cyan) sweeps across the digit stream left-to-right, leaving a brief trail. CSS `box-shadow` with 20px blur radius in cyan. |
| **Progress Counter** | Bottom-left: "Scanning digit 142,857 of 1,000,000" with a slim MUI `LinearProgress` bar beneath it, color gradient matching the theme. |
| **Near-Miss Flashes** | When partial matches are found (e.g., first 2–3 digits match), flash those digits in gold briefly before continuing. Creates anticipation. |
| **Speed Ramp** | The scan starts slow (readable, ~50 digits/sec visually), accelerates to blur speed mid-scan, then dramatically slows down as it approaches the match position (within 200 digits). This creates a cinematic "homing in" feel. |
| **Pi Trivia Ticker** | A rotating ticker at the bottom of the screen displays fun pi facts during the scan. See Section 2.2.3 for full spec. |
| **Sound (Optional)** | If feasible, a subtle sci-fi hum that increases in pitch as the scan progresses. Not required for MVP but a nice-to-have via Web Audio API. |
| **Duration Target** | The entire scan animation should last 4–8 seconds regardless of actual position. If the match is at digit 50, artificially extend the animation. If at digit 900,000, compress it. The visual pace is decoupled from the actual search. |

#### 2.2.3 Pi Trivia Ticker

During the Phase 2 scan animation, a trivia ticker runs along the bottom of the viewport, cycling through pi-related facts to keep users engaged while the dramatic digit scan plays out.

**Layout & Styling:**

- Positioned as a fixed bar at the bottom of the viewport, above the progress counter.
- Full-width, semi-transparent dark background (`rgba(10, 10, 26, 0.85)`) with a subtle top border in neon blue (`1px solid rgba(0, 212, 255, 0.3)`).
- Text in Inter font, 14px on mobile / 16px on desktop, color `#8892b0` (text-muted).
- A small "π" prefix icon in neon blue before each fact.
- Height: 48px on desktop, 40px on mobile. Single-line, truncated with ellipsis if needed on very small screens.

**Animation:**

- Facts cross-fade in/out every 3 seconds using Framer Motion's `AnimatePresence` with a vertical slide + fade transition (new fact slides up from below as old fact fades up and out).
- The ticker starts when Phase 2 begins and stops when the match is found (Phase 3 begins).
- On `prefers-reduced-motion`, disable the slide animation and use instant swap instead (still rotate facts, just no motion).

**Trivia Content (`src/lib/piTrivia.ts`):**

Store as a simple string array. Shuffle on each scan so users see different facts on repeat visits. Include at least 20 facts. Examples:

1. "π has been calculated to over 105 trillion digits — and counting."
2. "The first 144 digits of π add up to 666."
3. "In the Star Trek episode 'Wolf in the Fold,' Spock defeats a computer by asking it to compute π to the last digit."
4. "Albert Einstein was born on Pi Day — March 14, 1879."
5. "The record for memorizing π is 70,030 digits, held by Suresh Kumar Sharma."
6. "π is irrational — its decimal representation never ends and never repeats."
7. "The ancient Egyptians approximated π as 3.1605 — remarkably close for 1650 BCE."
8. "If you write π to 39 digits, you can calculate the circumference of the observable universe to within the width of a hydrogen atom."
9. "There's a language called Pilish where each word length matches a digit of π."
10. "The probability that two random integers are coprime is 6/π²."
11. "In 1897, an Indiana bill nearly legislated π to be 3.2. It failed."
12. "π appears in the equation for the normal distribution — the bell curve."
13. "The Feynman point — six consecutive 9s — begins at position 762 in π."
14. "Archimedes was the first to rigorously approximate π using 96-sided polygons."
15. "William Shanks calculated π to 707 places by hand in 1873. He was wrong after digit 527."
16. "March 14 at 1:59:26 is the most precise Pi Day moment — 3.1415926."
17. "π is transcendental — it cannot be the root of any polynomial with rational coefficients."
18. "The Greek letter π was first used for the ratio by William Jones in 1706."
19. "Buffon's needle problem: dropping needles on lined paper approximates π."
20. "If you search long enough in π, you can find any finite sequence of digits — including your phone number."

**Accuracy Verification:** Before including any trivia, Claude Code CLI should verify the factual accuracy of each item. For any fact that is disputed or unverifiable, replace it with a safe mathematical fact about π.

### 2.3 Phase 3 — The Reveal & Celebration

The moment of truth. The scan locks onto the match and the app explodes with celebration.

#### 2.3.1 Match Lock-On Sequence

1. The digit stream freezes. The matched digits flash 3 times in rapid succession (white → gold → white).
2. The matched digits zoom/scale up to 2x size with a glowing gold outline while surrounding digits fade to 20% opacity.
3. A full-screen confetti explosion fires using `canvas-confetti` (npm package) with custom colors (gold, cyan, magenta, white).
4. Background shifts from dark to a radial gradient burst (dark center, colorful edges).
5. The trivia ticker fades out as the celebration begins.

#### 2.3.2 Result Card

After the celebration settles (1.5s), a result card slides up from the bottom:

| Element | Content |
|---------|---------|
| **Card Style** | Glassmorphism: frosted glass background (`backdrop-filter: blur(20px)`), subtle border glow, rounded corners (16px). |
| **Primary Message** | "Your birthday appears at position [N] in π!" — large, white, bold. The position number should animate counting up from 0 to N. |
| **Digit Context** | Show a horizontal strip of ~40 digits of π centered on the match, with the matching digits highlighted in gold/neon. Monospaced font, scrollable if needed. |
| **Fun Fact Line** | "That's [X]% of the way through the first million digits!" or a fun comparison: "That's roughly the [N]th digit — further than most humans have ever memorized!" |
| **Match Type Badge** | A small pill badge: "🌟 Full Date Match" (8-digit) in gold, "🎂 Month+Day Match" (4-digit) in cyan, or "🔍 Partial Match" in silver. |
| **Share Button** | "Share Your Pi Position" — copies a pre-formatted message to clipboard: "My birthday is hiding at position [N] in π! Find yours at [URL] #PiDay". Uses `navigator.clipboard` API with a toast confirmation. |
| **Try Again Button** | "Try Another Birthday" — outlined button, resets to Phase 1 with a smooth reverse transition. |

---

## 3. Technical Architecture

### 3.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI Library | MUI (Material UI) v6 with custom dark theme |
| Animation | Framer Motion for page transitions and element animations |
| Confetti | `canvas-confetti` (npm) for celebration particles |
| Fonts | Google Fonts: Inter (body), JetBrains Mono (digits) |
| Pi Data | Static JSON in `/public/pi-digits.json` (first 1M digits as a single string) |
| Deployment | Vercel (zero-config Next.js deploy) |

### 3.2 Project Structure

```
pi-birthday-finder/
├── public/
│   └── pi-digits.json            # First 1M digits of π (after decimal)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, ThemeProvider, font imports
│   │   ├── page.tsx              # Main page, orchestrates phases
│   │   └── globals.css           # CSS custom properties, keyframes, base styles
│   ├── components/
│   │   ├── BirthdayInput.tsx     # Phase 1: date picker + CTA
│   │   ├── ScanAnimation.tsx     # Phase 2: digit scanning sequence
│   │   ├── ResultCard.tsx        # Phase 3: celebration + result display
│   │   ├── DigitStream.tsx       # Reusable: animated digit display
│   │   ├── FloatingDigits.tsx    # Background particle effect
│   │   ├── PiTriviaTicker.tsx    # Phase 2: rotating fact ticker
│   │   └── ConfettiExplosion.tsx # canvas-confetti wrapper
│   ├── hooks/
│   │   ├── usePiSearch.ts        # Core search logic + match result
│   │   └── useScanAnimation.ts   # Animation timing + speed ramp logic
│   ├── lib/
│   │   ├── piLoader.ts           # Loads/caches pi digits from JSON
│   │   ├── searchStrategies.ts   # Birthday → search strings conversion
│   │   ├── piTrivia.ts           # Array of 20+ pi facts, shuffle utility
│   │   └── funFacts.ts           # Position-based fun fact generator
│   └── theme/
│       └── theme.ts              # MUI dark theme configuration
├── CLAUDE.md                     # Build instructions for Claude Code CLI
├── next.config.ts
├── tsconfig.json
└── package.json
```

### 3.3 Pi Digit Data Strategy

The first 1,000,000 digits of π (after the decimal point) are stored as a single string in a static JSON file. This file is approximately 1MB uncompressed and will be gzip-compressed by Vercel's CDN to ~450KB.

**Source:** Use a verified source such as piday.org or the pi-decimals npm package to generate the file. The build script should validate the first 100 known digits before writing.

**Loading:** Fetch asynchronously on page load using `fetch('/pi-digits.json')`. Show a subtle loading indicator (pulsing π symbol) until loaded. Cache in a React ref to avoid re-fetching.

**Search:** Use `String.prototype.indexOf()` for the actual search — this is effectively instant for 1M characters. The animation timing is purely cosmetic.

### 3.4 Search Logic (`searchStrategies.ts`)

Given a birthday, generate search strings in priority order:

| Priority | Format | Example (Jul 4, 1990) | Label |
|----------|--------|----------------------|-------|
| 1 | MMDDYYYY | `07041990` | 🌟 Full Date Match |
| 2 | DDMMYYYY | `04071990` | 🌟 Full Date Match (Intl) |
| 3 | MMDD | `0704` | 🎂 Month+Day Match |
| 4 | MMDDYY | `070490` | 🎂 Date Match (Short Year) |
| 5 | MDD or MD | `74` | 🔍 Partial Match |

The app uses the first match found in priority order. The match type determines the celebration badge and messaging.

---

## 4. Theme & Design System

### 4.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#0a0a1a` | Deep space background |
| `bg-secondary` | `#1a1a2e` | Card backgrounds, elevated surfaces |
| `neon-blue` | `#00d4ff` | Primary accent, scan cursor, links |
| `neon-purple` | `#b24bff` | Secondary accent, gradients |
| `neon-pink` | `#ff2d95` | Tertiary accent, hover states |
| `neon-green` | `#39ff14` | Active scan highlight |
| `gold` | `#ffd700` | Match highlight, celebration |
| `text-primary` | `#ffffff` | Headlines, primary text |
| `text-muted` | `#8892b0` | Subtext, labels, trivia ticker |

### 4.2 Typography

- **Body/UI:** Inter (Google Fonts) — clean, modern, excellent screen readability.
- **Digits/Code:** JetBrains Mono (Google Fonts) — monospaced, distinct digit shapes, ligature support.
- **Hero π:** System default serif at massive scale (200px+) with CSS glow effects.
- **Trivia Ticker:** Inter at 14px (mobile) / 16px (desktop), muted color.

### 4.3 Animation Guidelines

- Use Framer Motion for all page/component transitions (`AnimatePresence` for phase changes).
- CSS `@keyframes` for continuous ambient effects (pulsing, floating, glow cycling).
- `requestAnimationFrame` for the digit stream scroll during Phase 2 — not CSS animations, for precise speed control.
- Framer Motion `AnimatePresence` for the trivia ticker cross-fade transitions.
- All animations should respect `prefers-reduced-motion: reduce` by falling back to instant transitions and static displays.

---

## 5. Responsive Design

The app must work beautifully at all viewport sizes.

| Breakpoint | Adjustments |
|-----------|-------------|
| **Mobile (<600px)** | Stack all elements vertically. Reduce digit stream to 2–3 rows. Result card becomes full-width bottom sheet. π hero scales to 120px. Digit context strip scrolls horizontally. Trivia ticker 40px height, 14px text, single-line truncate with ellipsis. |
| **Tablet (600–960px)** | Digit stream 4–5 rows. Result card centered at 80% width. Trivia ticker 48px height. Standard layout otherwise. |
| **Desktop (960px+)** | Full experience. Digit stream 6–8 rows filling viewport. Generous spacing. Trivia ticker 48px height, 16px text. |

---

## 6. Performance Requirements

- Lighthouse score: 90+ on Performance, 100 on Accessibility.
- First Contentful Paint < 1.5s on 4G connection.
- Pi digit file loads async, does not block initial render.
- Scan animation runs at 60fps — use GPU-accelerated CSS transforms, avoid layout thrashing.
- `canvas-confetti` is dynamically imported (`next/dynamic`) to avoid increasing initial bundle.
- Trivia ticker uses simple string array — no external data fetching.

---

## 7. Accessibility

- All interactive elements keyboard-navigable with visible focus indicators.
- Date picker fully accessible (MUI DatePicker handles this natively).
- Screen reader announcements: `aria-live` region announces "Scanning digits of pi..." during Phase 2 and "Match found at position N" during Phase 3.
- `prefers-reduced-motion`: disable all non-essential animation, show result immediately after brief pause. Trivia ticker swaps facts without slide animation.
- `prefers-color-scheme`: dark is the default (and only) theme, but ensure sufficient contrast ratios (WCAG AA minimum).
- Share button has proper `aria-label` and announces clipboard copy confirmation.
- Trivia ticker has `aria-live="polite"` so screen readers announce new facts without interrupting.

---

## 8. Edge Cases

| Scenario | Handling |
|----------|---------|
| No 8-digit match found | Fall through to 4-digit, then shorter matches. Always guaranteed to find at least a 2-digit match within 1M digits. |
| February 29 birthday | Accept it. The date picker should allow Feb 29 regardless of year. The search doesn't care about leap year validity. |
| Pi digits fail to load | Show a friendly error: "Looks like π is being irrational today. Please refresh and try again." with a retry button. |
| User enters today's date | Allow it. No special handling needed — it's a valid birthday. |
| Rapid re-searches | Debounce: disable the Search button during animation. "Try Again" button only appears after Phase 3 completes. |
| Very early match (< digit 100) | Still run the full 4–8 second animation. The scan should feel dramatic regardless of actual position. |
| Scan completes before trivia cycles | Minimum 2 trivia facts shown even on short scans — pad the animation if needed. |

---

## 9. Future Enhancements (Post-MVP)

Not in scope for the initial one-shot build, but fun ideas for iteration:

1. **Social OG Image:** Generate a dynamic Open Graph image via Next.js og image generation showing the user's π position for rich social sharing previews.
2. **Pi Position Leaderboard:** Anonymous stats showing distribution of where birthdays fall in π.
3. **Audio Mode:** Full sci-fi sound design with Web Audio API — scanning hum, match chime, celebration fanfare.
4. **Extended Digits:** Option to search 10M or 100M digits via chunked loading for those rare full-date matches.
5. **Multi-Language Support:** i18n for date formats (DD/MM vs MM/DD) with locale detection.
