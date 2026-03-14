# Pi Day Birthday Finder — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page Next.js app where users enter their birthday, watch a 4–8 second sci-fi digit scan through 1 million digits of π, and celebrate when their date is found.

**Architecture:** Three-phase state machine (`input → scanning → result`) in `page.tsx`. All search runs instantly via `indexOf`; the scan animation is purely cosmetic, driven by a `requestAnimationFrame` loop in `useScanAnimation`. Framer Motion `AnimatePresence` handles phase transitions. Phase 3 switches the digit stream from RAF rolling-window rendering to individual DOM `<span>` elements for the flash/scale celebration.

**Tech Stack:** Next.js 15 (App Router, TypeScript), MUI v6 + Emotion, Framer Motion, canvas-confetti, date-fns, Jest + React Testing Library

---

**Working directory:** All `npm` and `npx` commands run from inside `pi-birthday-finder/` (the Next.js project root at `/Users/todd.greco/current_work/pi-day/pi-birthday-finder/`) unless explicitly noted otherwise.

**Spec reference:** `/Users/todd.greco/current_work/pi-day/docs/superpowers/specs/2026-03-14-pi-birthday-finder-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `scripts/download-pi.js` | Node script: fetch 1M pi digits, validate, write `public/pi-digits.json` |
| `src/lib/piLoader.ts` | Async fetch + cache pi digits string from `/pi-digits.json` |
| `src/lib/searchStrategies.ts` | Convert `Date` → priority-ordered `SearchCandidate[]` |
| `src/lib/piTrivia.ts` | 20+ verified pi facts array + Fisher-Yates shuffle |
| `src/lib/funFacts.ts` | `getFunFact(position)` → position-range-based string |
| `src/hooks/usePiSearch.ts` | Run `indexOf` search, return `PiSearchResult` |
| `src/hooks/useScanAnimation.ts` | RAF loop, speed ramp, near-miss detection, `onComplete` callback |
| `src/theme/theme.ts` | MUI dark theme, neon palette overrides |
| `src/app/globals.css` | CSS custom properties, `@keyframes` for glow/pulse/float |
| `src/app/layout.tsx` | Root layout: ThemeProvider, CssBaseline, Inter + JetBrains Mono fonts |
| `src/app/page.tsx` | Phase state machine + AnimatePresence orchestration |
| `src/components/FloatingDigits.tsx` | CSS-animated ambient background digit particles |
| `src/components/BirthdayInput.tsx` | Phase 1: MUI DatePicker + "Search π" CTA button |
| `src/components/PiTriviaTicker.tsx` | Fixed bottom bar, AnimatePresence fact cross-fade every 3s |
| `src/components/DigitStream.tsx` | RAF-driven digit rows with scan cursor; switches to span-mode on `matchReveal` |
| `src/components/ScanAnimation.tsx` | Phase 2 shell: DigitStream + PiTriviaTicker + LinearProgress |
| `src/components/ConfettiExplosion.tsx` | canvas-confetti dynamic import wrapper |
| `src/components/ResultCard.tsx` | Phase 3: glassmorphism card, animated counter, share button |
| `__tests__/lib/searchStrategies.test.ts` | Unit tests for search string generation |
| `__tests__/lib/funFacts.test.ts` | Unit tests for `getFunFact` |
| `__tests__/hooks/usePiSearch.test.ts` | Hook tests with fake pi digit string |

---

## Chunk 1: Project Scaffolding + Pi Data

### Task 1: Initialize Next.js App

**Files:**
- Create: `pi-birthday-finder/` (entire project via create-next-app)

- [ ] **Step 1: Scaffold from pi-day directory**

```bash
cd /Users/todd.greco/current_work/pi-day
npx create-next-app@latest pi-birthday-finder --typescript --app --src-dir --tailwind=false --eslint --import-alias "@/*"
```

When prompted, accept defaults (use App Router: Yes, customize import alias: keep `@/*`).
Expected: `pi-birthday-finder/` directory created with `src/app/layout.tsx`, `src/app/page.tsx`.

- [ ] **Step 2: Install runtime dependencies**

```bash
cd pi-birthday-finder
npm install @mui/material @mui/x-date-pickers @emotion/react @emotion/styled framer-motion canvas-confetti date-fns
npm install -D @types/canvas-confetti
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/dom
```

- [ ] **Step 4: Create `jest.config.ts`**

```typescript
// pi-birthday-finder/jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
}

export default createJestConfig(config)
```

- [ ] **Step 5: Create `jest.setup.ts`**

```typescript
// pi-birthday-finder/jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

In `pi-birthday-finder/package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 7: Verify Jest works**

```bash
mkdir -p __tests__/lib
echo 'test("smoke", () => expect(1).toBe(1))' > __tests__/lib/smoke.test.ts
npm test -- --testPathPattern=smoke
```

Expected: 1 test passes. Delete `__tests__/lib/smoke.test.ts` after confirming.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with deps and Jest"
```

---

### Task 2: Pi Digit Download Script

**Files:**
- Create: `scripts/download-pi.js`

- [ ] **Step 1: Create scripts directory and download script**

```javascript
// pi-birthday-finder/scripts/download-pi.js
const https = require('https')
const fs = require('fs')
const path = require('path')

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'pi-digits.json')
const KNOWN_PREFIX = '14159265358979323846'
const DIGITS_NEEDED = 1_000_000

// Pi digits from a reliable static source (first 1M digits after decimal)
// Source: https://pi2e.ch/blog/2017/03/10/pi-digits-download/
const PI_URL = 'https://pi2e.ch/blog/wp-content/uploads/2017/03/pi_dec_1m.txt'

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  console.log('Downloading pi digits...')
  let raw
  try {
    raw = await fetchUrl(PI_URL)
  } catch (err) {
    console.error('Primary download failed:', err.message)
    console.log('Trying fallback source...')
    try {
      raw = await fetchUrl('https://www.angio.net/pi/pi-million.txt')
    } catch (err2) {
      console.error('Fallback also failed:', err2.message)
      console.error('\nOffline recovery: manually download pi digits and place at public/pi-digits.json')
      console.error('File format: {"digits":"14159265358979..."}  (1,000,000 digits after decimal)')
      console.error('Verified sources: https://pi2e.ch or https://www.angio.net/pi/pi-million.txt')
      process.exit(1)
    }
  }

  // The file may start with "3." — strip the "3." prefix if present
  let digits = raw.trim()
  if (digits.startsWith('3.')) {
    digits = digits.slice(2)
  } else if (digits.startsWith('3')) {
    digits = digits.slice(1)
  }

  // Remove any whitespace or newlines
  digits = digits.replace(/\s/g, '')

  // Take exactly 1M digits
  digits = digits.slice(0, DIGITS_NEEDED)

  if (digits.length < DIGITS_NEEDED) {
    console.error(`Only got ${digits.length} digits, need ${DIGITS_NEEDED}`)
    process.exit(1)
  }

  if (!digits.startsWith(KNOWN_PREFIX)) {
    console.error(`Validation failed! Expected digits to start with ${KNOWN_PREFIX}`)
    console.error(`Got: ${digits.slice(0, 20)}`)
    process.exit(1)
  }

  const output = JSON.stringify({ digits })
  fs.mkdirSync(path.join(__dirname, '..', 'public'), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8')
  console.log(`✓ Saved ${digits.length} pi digits to ${OUTPUT_PATH}`)
  console.log(`  Starts with: ${digits.slice(0, 20)}...`)
}

main()
```

- [ ] **Step 2: Run the download script**

```bash
node scripts/download-pi.js
```

Expected output:
```
Downloading pi digits...
✓ Saved 1000000 pi digits to .../public/pi-digits.json
  Starts with: 14159265358979323846...
```

If network is unavailable, generate using a known-good pi source or embed the first 1M digits from a local file. The validation (`startsWith("14159265358979323846")`) must pass.

- [ ] **Step 3: Verify the file**

```bash
node -e "const d = require('./public/pi-digits.json'); console.log('length:', d.digits.length); console.log('start:', d.digits.slice(0,20))"
```

Expected: `length: 1000000`, `start: 14159265358979323846`

- [ ] **Step 4: Add to gitignore**

Add to `pi-birthday-finder/.gitignore`:
```
# Pi digit data (large, regeneratable)
public/pi-digits.json
```

- [ ] **Step 5: Commit**

```bash
git add scripts/download-pi.js .gitignore
git commit -m "chore: add pi digit download script"
```

---

## Chunk 2: Core Data Layer

### Task 3: Pi Trivia Data

**Files:**
- Create: `src/lib/piTrivia.ts`

- [ ] **Step 1: Create piTrivia.ts**

```typescript
// src/lib/piTrivia.ts

export const PI_TRIVIA: string[] = [
  'π has been calculated to over 105 trillion digits — and counting.',
  'Albert Einstein was born on Pi Day — March 14, 1879.',
  'π is irrational — its decimal representation never ends and never repeats.',
  'If you write π to 39 digits, you can calculate the circumference of the observable universe to within the width of a hydrogen atom.',
  'The probability that two random integers share no common factors is 6/π².',
  'In 1897, an Indiana bill nearly legislated π to be 3.2. It failed.',
  'π appears in the normal distribution formula — the bell curve.',
  'The Feynman point — six consecutive 9s — begins at position 762 in π.',
  'Archimedes was the first to rigorously approximate π using 96-sided polygons.',
  'William Shanks calculated π to 707 decimal places by hand in 1873. He was wrong after digit 527.',
  'March 14 at 1:59:26 AM is the most precise Pi Moment — 3.1415926.',
  'π is transcendental — it cannot be the root of any polynomial with rational coefficients.',
  'The Greek letter π was first used for this ratio by William Jones in 1706.',
  "Buffon's needle problem: dropping needles on lined paper can approximate π.",
  'There is a poetic form called Pilish where word lengths match successive digits of π.',
  'The ancient Egyptians approximated π as (16/9)² ≈ 3.1605 around 1650 BCE.',
  'In Star Trek\'s "Wolf in the Fold," Spock defeats a computer by asking it to compute π to the last digit.',
  'The current record for memorizing π is 70,030 digits, set by Suresh Kumar Sharma in 2015.',
  'π is normal — statistically, every digit 0–9 appears with equal frequency in the long run.',
  'If you search long enough in π, you can find any finite sequence of digits — including your birthday.',
  'The ratio of a circle\'s circumference to its diameter is π, regardless of the circle\'s size.',
  'Euler\'s identity, e^(iπ) + 1 = 0, connects π with five fundamental mathematical constants.',
  'The first 144 digits of π sum to 666.',
  'A supercomputer calculated π to 100 trillion digits in 2022 — the computation took 157 days.',
]

/** Fisher-Yates shuffle — returns a new shuffled array */
export function shuffleTrivia(arr: string[]): string[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/piTrivia.ts
git commit -m "feat: add pi trivia data and shuffle utility"
```

---

### Task 4: Search Strategies

**Files:**
- Create: `src/lib/searchStrategies.ts`
- Create: `__tests__/lib/searchStrategies.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/lib/searchStrategies.test.ts
import { getSearchCandidates } from '@/lib/searchStrategies'

describe('getSearchCandidates', () => {
  const july4_1990 = new Date(1990, 6, 4) // month is 0-indexed

  it('returns candidates in priority order', () => {
    const candidates = getSearchCandidates(july4_1990)
    expect(candidates[0].pattern).toBe('07041990') // MMDDYYYY
    expect(candidates[1].pattern).toBe('04071990') // DDMMYYYY
    expect(candidates[2].pattern).toBe('0704')     // MMDD
    expect(candidates[3].pattern).toBe('070490')   // MMDDYY
    expect(candidates[4].pattern).toBe('74')       // MD (single digits)
  })

  it('includes correct match type labels', () => {
    const candidates = getSearchCandidates(july4_1990)
    expect(candidates[0].matchType).toBe('full-mmddyyyy')
    expect(candidates[1].matchType).toBe('full-ddmmyyyy')
    expect(candidates[2].matchType).toBe('month-day-mmdd')
    expect(candidates[3].matchType).toBe('month-day-mmddyy')
    expect(candidates[4].matchType).toBe('partial-md')
  })

  it('does NOT include MD partial for double-digit month', () => {
    const oct31 = new Date(2000, 9, 31) // October 31
    const candidates = getSearchCandidates(oct31)
    expect(candidates.some(c => c.matchType === 'partial-md')).toBe(false)
    expect(candidates[2].pattern).toBe('1031') // MMDD covers it
  })

  it('does NOT include MD partial for double-digit day', () => {
    const jan15 = new Date(2000, 0, 15) // January 15
    const candidates = getSearchCandidates(jan15)
    expect(candidates.some(c => c.matchType === 'partial-md')).toBe(false)
  })

  it('pads single-digit month and day correctly', () => {
    const jan1 = new Date(2000, 0, 1) // January 1
    const candidates = getSearchCandidates(jan1)
    expect(candidates[0].pattern).toBe('01012000') // MMDDYYYY
    expect(candidates[2].pattern).toBe('0101')     // MMDD
    expect(candidates[4].pattern).toBe('11')       // MD (both single digit)
  })

  it('handles December 31 correctly', () => {
    const dec31 = new Date(1999, 11, 31) // December 31
    const candidates = getSearchCandidates(dec31)
    expect(candidates[0].pattern).toBe('12311999')
    expect(candidates[2].pattern).toBe('1231')
    // No MD partial: month=12, day=31 are both double-digit
    expect(candidates.some(c => c.matchType === 'partial-md')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test -- --testPathPattern=searchStrategies
```

Expected: FAIL — `Cannot find module '@/lib/searchStrategies'`

- [ ] **Step 3: Implement searchStrategies.ts**

```typescript
// src/lib/searchStrategies.ts

export type MatchType =
  | 'full-mmddyyyy'
  | 'full-ddmmyyyy'
  | 'month-day-mmdd'
  | 'month-day-mmddyy'
  | 'partial-md'

export interface SearchCandidate {
  pattern: string
  matchType: MatchType
  label: string
}

export function getSearchCandidates(date: Date): SearchCandidate[] {
  const month = date.getMonth() + 1  // 1–12
  const day = date.getDate()          // 1–31
  const year = date.getFullYear()

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  const yyyy = String(year)
  const yy = yyyy.slice(-2)

  const candidates: SearchCandidate[] = [
    { pattern: mm + dd + yyyy, matchType: 'full-mmddyyyy', label: '🌟 Full Date Match' },
    { pattern: dd + mm + yyyy, matchType: 'full-ddmmyyyy', label: '🌟 Full Date Match (Intl)' },
    { pattern: mm + dd,        matchType: 'month-day-mmdd',   label: '🎂 Month+Day Match' },
    { pattern: mm + dd + yy,   matchType: 'month-day-mmddyy', label: '🎂 Date Match (Short Year)' },
  ]

  // Priority 5: unpadded MD — only when both month and day are single digits
  if (month <= 9 && day <= 9) {
    candidates.push({
      pattern: String(month) + String(day),
      matchType: 'partial-md',
      label: '🔍 Partial Match',
    })
  }

  return candidates
}
```

- [ ] **Step 4: Run tests to confirm passing**

```bash
npm test -- --testPathPattern=searchStrategies
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/searchStrategies.ts __tests__/lib/searchStrategies.test.ts
git commit -m "feat: implement search strategies with tests"
```

---

### Task 5: Fun Facts Generator

**Files:**
- Create: `src/lib/funFacts.ts`
- Create: `__tests__/lib/funFacts.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/lib/funFacts.test.ts
import { getFunFact } from '@/lib/funFacts'

describe('getFunFact', () => {
  it('returns "practically at the start" for very early positions', () => {
    expect(getFunFact(1)).toContain('practically at the start')
    expect(getFunFact(10000)).toContain('practically at the start')
  })

  it('returns percentage for mid-early positions', () => {
    const fact = getFunFact(50000)
    expect(fact).toContain('%')
    expect(fact).toContain('5.0')
  })

  it('returns "most humans" message for 50k–200k range', () => {
    expect(getFunFact(51000)).toContain('most humans')
    expect(getFunFact(200000)).toContain('most humans')
  })

  it('returns memorization message for 200k–500k range', () => {
    const fact = getFunFact(300000)
    expect(fact).toContain('memorize')
    expect(fact).toContain('300,000')
  })

  it('returns "second half" for 500k–900k range', () => {
    expect(getFunFact(600000)).toContain('second half')
  })

  it('returns "very end" message for 900k+ positions', () => {
    const fact = getFunFact(950000)
    expect(fact).toContain('last')
    expect(fact).toContain('50,000')
  })

  it('handles -1 (no match) gracefully', () => {
    expect(getFunFact(-1)).toContain('beyond the first million')
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test -- --testPathPattern=funFacts
```

Expected: FAIL.

- [ ] **Step 3: Implement funFacts.ts**

```typescript
// src/lib/funFacts.ts

export function getFunFact(position: number): string {
  if (position < 0) {
    return "Your birthday is beyond the first million digits — truly hidden in π!"
  }
  if (position <= 10_000) {
    return "That's in the first 1% of π — your birthday is practically at the start!"
  }
  if (position <= 50_000) {
    const pct = Math.round((position / 1_000_000) * 100 * 10) / 10
    return `That's ${pct}% of the way through the first million digits.`
  }
  if (position <= 200_000) {
    return "Further than most humans have ever memorized!"
  }
  if (position <= 500_000) {
    return `You'd need to memorize π to ${position.toLocaleString()} digits to reach your birthday.`
  }
  if (position <= 900_000) {
    return "Hiding deep — in the second half of the first million digits."
  }
  const remaining = 1_000_000 - position
  return `Almost at the very end — your birthday is in the last ${remaining.toLocaleString()} digits!`
}
```

- [ ] **Step 4: Run tests to confirm passing**

```bash
npm test -- --testPathPattern=funFacts
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/funFacts.ts __tests__/lib/funFacts.test.ts
git commit -m "feat: implement fun facts generator with tests"
```

---

### Task 6: Pi Loader

**Files:**
- Create: `src/lib/piLoader.ts`

- [ ] **Step 1: Implement piLoader.ts**

```typescript
// src/lib/piLoader.ts

let cachedDigits: string | null = null

export async function loadPiDigits(): Promise<string> {
  if (cachedDigits) return cachedDigits

  const res = await fetch('/pi-digits.json')
  if (!res.ok) {
    throw new Error(`Failed to load pi digits: ${res.status}`)
  }

  const data = await res.json() as { digits: string }
  cachedDigits = data.digits
  return cachedDigits
}

export function getCachedPiDigits(): string | null {
  return cachedDigits
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/piLoader.ts
git commit -m "feat: add pi digit loader with caching"
```

---

## Chunk 3: Theme + Layout Foundation

### Task 7: MUI Theme

**Files:**
- Create: `src/theme/theme.ts`

- [ ] **Step 1: Create theme.ts**

```typescript
// src/theme/theme.ts
'use client'

import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a1a',
      paper: '#1a1a2e',
    },
    primary: {
      main: '#00d4ff',
      contrastText: '#000000',
    },
    secondary: {
      main: '#b24bff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8892b0',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a1a',
          margin: 0,
          padding: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00d4ff',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00d4ff',
            boxShadow: '0 0 12px rgba(0, 212, 255, 0.4)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(0, 212, 255, 0.3)',
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '&.Mui-selected': {
            backgroundColor: '#00d4ff',
            color: '#000000',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.2)',
          },
        },
      },
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
mkdir -p src/theme
git add src/theme/theme.ts
git commit -m "feat: add MUI dark theme with neon palette"
```

---

### Task 8: Global CSS + Root Layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install MUI App Router SSR adapter**

```bash
npm install @mui/material-nextjs @emotion/cache
```

Expected: package added to `node_modules`. This is required for `layout.tsx` to import `AppRouterCacheProvider`.

- [ ] **Step 2: Replace globals.css**

```css
/* src/app/globals.css */

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

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

@keyframes piGlow {
  0%, 100% {
    text-shadow:
      0 0 20px rgba(0, 212, 255, 0.8),
      0 0 40px rgba(0, 212, 255, 0.4),
      0 0 80px rgba(0, 212, 255, 0.2);
    color: var(--neon-blue);
  }
  33% {
    text-shadow:
      0 0 20px rgba(178, 75, 255, 0.8),
      0 0 40px rgba(178, 75, 255, 0.4),
      0 0 80px rgba(178, 75, 255, 0.2);
    color: var(--neon-purple);
  }
  66% {
    text-shadow:
      0 0 20px rgba(255, 45, 149, 0.8),
      0 0 40px rgba(255, 45, 149, 0.4),
      0 0 80px rgba(255, 45, 149, 0.2);
    color: var(--neon-pink);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.04; }
  25% { transform: translateY(-20px) rotate(5deg); opacity: 0.07; }
  50% { transform: translateY(-10px) rotate(-3deg); opacity: 0.05; }
  75% { transform: translateY(-30px) rotate(8deg); opacity: 0.06; }
}

@keyframes digitFlash {
  0%, 100% { color: #ffffff; transform: scale(1); text-shadow: none; }
  50% { color: var(--gold); transform: scale(2); text-shadow: 0 0 20px var(--gold); }
}

@keyframes scanPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 20px cyan, 0 0 40px rgba(0, 255, 255, 0.4); }
  50% { opacity: 0.7; box-shadow: 0 0 10px cyan; }
}
```

- [ ] **Step 3: Replace layout.tsx**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/theme/theme'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Find Your Birthday in π',
  description: 'Every birthday is hiding somewhere in the infinite digits of pi. Let\'s find yours.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Open http://localhost:3000. Expected: default Next.js page loads without errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx package.json package-lock.json
git commit -m "feat: add global CSS, MUI theme integration, root layout"
```

---

## Chunk 4: Hooks

### Task 9: usePiSearch Hook

**Files:**
- Create: `src/hooks/usePiSearch.ts`
- Create: `__tests__/hooks/usePiSearch.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/hooks/usePiSearch.test.ts
import { searchPiDigits } from '@/hooks/usePiSearch'

describe('searchPiDigits', () => {
  it('finds 8-digit MMDDYYYY match first (highest priority)', () => {
    // Build a string where both MMDD and MMDDYYYY exist
    const digits = '00000000' + '07041990' + '0000' + '0704' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('full-mmddyyyy')
    expect(result!.matchStr).toBe('07041990')
    expect(result!.position).toBe(9) // 1-based: index 8 + 1
  })

  it('falls back to MMDD when no 8-digit match', () => {
    const digits = '0'.repeat(10) + '0704' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('month-day-mmdd')
    expect(result!.position).toBe(11) // 1-based: index 10 + 1
  })

  it('falls back to MD partial for single-digit month+day when no longer match', () => {
    const digits = '0'.repeat(10) + '74' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('partial-md')
    expect(result!.position).toBe(11)
  })

  it('returns correct context strips', () => {
    // 10 chars before match, 10 chars after match, then padding
    // contextBefore = slice(max(0, 10-20), 10) = slice(0,10) = '1234567890'
    // contextAfter  = slice(14, min(len, 14+20)) = '9876543210' + '0'.repeat(10)
    const digits = '1234567890' + '0704' + '9876543210' + '0'.repeat(80)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result!.contextBefore).toBe('1234567890')
    expect(result!.contextAfter).toBe('9876543210' + '0'.repeat(10))
  })

  it('returns null if no match found', () => {
    const digits = '9'.repeat(100)
    const result = searchPiDigits(digits, new Date(2024, 1, 29)) // Feb 29
    // "02292024", "02291924", "0229", "022924" — none in all-9s
    expect(result).toBeNull()
  })

  it('position is 1-based', () => {
    const digits = '07041990' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result!.position).toBe(1) // first digit = position 1
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npm test -- --testPathPattern=usePiSearch
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement usePiSearch.ts**

```typescript
// src/hooks/usePiSearch.ts
import { getSearchCandidates, type MatchType } from '@/lib/searchStrategies'

export interface PiSearchResult {
  position: number       // 1-based position in pi digits
  matchType: MatchType
  label: string
  matchStr: string
  contextBefore: string  // up to 20 digits before match
  contextAfter: string   // up to 20 digits after match
}

/** Pure search function — usable in tests and hooks */
export function searchPiDigits(digits: string, date: Date): PiSearchResult | null {
  const candidates = getSearchCandidates(date)

  for (const candidate of candidates) {
    const index = digits.indexOf(candidate.pattern)
    if (index !== -1) {
      const contextStart = Math.max(0, index - 20)
      const contextEnd = Math.min(digits.length, index + candidate.pattern.length + 20)
      return {
        position: index + 1,  // convert to 1-based
        matchType: candidate.matchType,
        label: candidate.label,
        matchStr: candidate.pattern,
        contextBefore: digits.slice(contextStart, index),
        contextAfter: digits.slice(index + candidate.pattern.length, contextEnd),
      }
    }
  }
  return null
}
```

- [ ] **Step 4: Run tests to confirm passing**

```bash
npm test -- --testPathPattern=usePiSearch
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePiSearch.ts __tests__/hooks/usePiSearch.test.ts
git commit -m "feat: implement pi search hook with tests"
```

---

### Task 10: useScanAnimation Hook

**Files:**
- Create: `src/hooks/useScanAnimation.ts`

The hook drives the cosmetic timeline. Key design:
- Total duration: **6 seconds** (fixed)
- Phase boundaries: slow 0–15%, fast 15–80%, homing 80–100%
- Position mapping: slow → 0 to 5% of matchIndex; fast → 5% to 90%; homing → 90% to 100% (ease-out)
- Near-miss: on each tick, sample real pi digits at `visualPosition` against first 2+ chars of any search pattern

- [ ] **Step 1: Implement useScanAnimation.ts**

```typescript
// src/hooks/useScanAnimation.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SearchCandidate } from '@/lib/searchStrategies'

export type AnimPhase = 'slow' | 'fast' | 'homing' | 'done'

export interface NearMiss {
  startIndex: number
  length: number
}

export interface ScanAnimationState {
  visualPosition: number   // 0-based index into pi digit string
  animPhase: AnimPhase
  progress: number         // 0–1 overall timeline progress
  nearMiss: NearMiss | null
}

interface UseScanAnimationOptions {
  matchIndex: number          // 0-based index of actual match in pi string
  piDigits: string            // full pi string for near-miss sampling
  searchCandidates: SearchCandidate[]
  onComplete: () => void
  enabled: boolean            // only start when true
}

const TOTAL_DURATION_MS = 6000

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Map 0–1 timeline progress to 0–1 position fraction */
function timeToPositionFraction(progress: number): number {
  if (progress <= 0.15) {
    // slow phase: linear 0 → 0.05
    return (progress / 0.15) * 0.05
  }
  if (progress <= 0.80) {
    // fast phase: linear 0.05 → 0.90
    const t = (progress - 0.15) / 0.65
    return 0.05 + t * 0.85
  }
  // homing phase: ease-out 0.90 → 1.0
  const t = (progress - 0.80) / 0.20
  return 0.90 + easeOut(t) * 0.10
}

export function useScanAnimation({
  matchIndex,
  piDigits,
  searchCandidates,
  onComplete,
  enabled,
}: UseScanAnimationOptions): ScanAnimationState {
  const [state, setState] = useState<ScanAnimationState>({
    visualPosition: 0,
    animPhase: 'slow',
    progress: 0,
    nearMiss: null,
  })

  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const checkNearMiss = useCallback((position: number): NearMiss | null => {
    for (const candidate of searchCandidates) {
      const prefix2 = candidate.pattern.slice(0, 2)
      if (piDigits.slice(position, position + 2) === prefix2) {
        // Check if it's a longer match
        let matchLen = 2
        for (let len = 3; len <= candidate.pattern.length; len++) {
          if (piDigits.slice(position, position + len) === candidate.pattern.slice(0, len)) {
            matchLen = len
          } else break
        }
        // Don't emit near-miss if it's the actual full match
        if (matchLen >= candidate.pattern.length && position === matchIndex) return null
        return { startIndex: position, length: matchLen }
      }
    }
    return null
  }, [piDigits, searchCandidates, matchIndex])

  useEffect(() => {
    if (!enabled) return
    completedRef.current = false

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / TOTAL_DURATION_MS, 1)

      const posFraction = timeToPositionFraction(progress)
      const visualPosition = Math.floor(posFraction * matchIndex)

      let animPhase: AnimPhase
      if (progress < 0.15) animPhase = 'slow'
      else if (progress < 0.80) animPhase = 'fast'
      else if (progress < 1.0) animPhase = 'homing'
      else animPhase = 'done'

      const nearMiss = animPhase !== 'done' ? checkNearMiss(visualPosition) : null

      setState({ visualPosition, animPhase, progress, nearMiss })

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else if (!completedRef.current) {
        completedRef.current = true
        onCompleteRef.current()
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      startTimeRef.current = null
    }
  }, [enabled, matchIndex, checkNearMiss])

  return state
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useScanAnimation.ts
git commit -m "feat: implement scan animation hook with RAF speed ramp"
```

---

## Chunk 5: Phase 1 Components

### Task 11: FloatingDigits Background

**Files:**
- Create: `src/components/FloatingDigits.tsx`

- [ ] **Step 1: Implement FloatingDigits.tsx**

```typescript
// src/components/FloatingDigits.tsx
'use client'

import { useMemo } from 'react'
import Box from '@mui/material/Box'

const DIGIT_COUNT = 30
const DIGITS = '0123456789'

interface FloatingDigit {
  digit: string
  top: string
  left: string
  fontSize: string
  animationDuration: string
  animationDelay: string
}

export default function FloatingDigits() {
  const floatingDigits = useMemo<FloatingDigit[]>(() => {
    // Deterministic seeded values to avoid hydration mismatch
    return Array.from({ length: DIGIT_COUNT }, (_, i) => {
      const seed = i * 7919 // prime multiplier for pseudo-random spread
      return {
        digit: DIGITS[(seed * 31) % 10],
        top: `${(seed * 13) % 100}%`,
        left: `${(seed * 17) % 100}%`,
        fontSize: `${12 + ((seed * 7) % 24)}px`,
        animationDuration: `${8 + ((seed * 11) % 12)}s`,
        animationDelay: `${-((seed * 5) % 8)}s`,
      }
    })
  }, [])

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {floatingDigits.map((d, i) => (
        <Box
          key={i}
          component="span"
          sx={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            fontSize: d.fontSize,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            color: 'rgba(255,255,255,0.05)',
            animation: `float ${d.animationDuration} ease-in-out ${d.animationDelay} infinite`,
            userSelect: 'none',
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }}
        >
          {d.digit}
        </Box>
      ))}
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FloatingDigits.tsx
git commit -m "feat: add floating digits background component"
```

---

### Task 12: BirthdayInput Component

**Files:**
- Create: `src/components/BirthdayInput.tsx`

- [ ] **Step 1: Implement BirthdayInput.tsx**

```typescript
// src/components/BirthdayInput.tsx
'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface BirthdayInputProps {
  onSearch: (date: Date) => void
  disabled?: boolean
}

export default function BirthdayInput({ onSearch, disabled = false }: BirthdayInputProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateError, setDateError] = useState(false)

  const today = new Date()
  const isValidDate = selectedDate !== null && selectedDate <= today && !dateError

  const handleSearch = () => {
    if (isValidDate && selectedDate) {
      onSearch(selectedDate)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
          px: 3,
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Pi Hero */}
        <Typography
          component="div"
          sx={{
            fontSize: { xs: '120px', sm: '160px', md: '220px' },
            fontWeight: 900,
            lineHeight: 1,
            animation: 'piGlow 4s ease-in-out infinite',
            mb: 2,
            userSelect: 'none',
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              color: 'var(--neon-blue)',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
            },
          }}
          aria-hidden="true"
        >
          π
        </Typography>

        {/* Headline */}
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
            textAlign: 'center',
            mb: 1.5,
            textShadow: '0 0 30px rgba(255,255,255,0.3)',
          }}
        >
          Find Your Birthday in π
        </Typography>

        {/* Subheadline */}
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
            maxWidth: 480,
            mb: 4,
            fontSize: { xs: '1rem', md: '1.1rem' },
            lineHeight: 1.6,
          }}
        >
          Every birthday is hiding somewhere in the infinite digits of pi. Let&apos;s find yours.
        </Typography>

        {/* Date Picker */}
        <Box sx={{ width: '100%', maxWidth: 360, mb: 3 }}>
          <DatePicker
            label="Your Birthday"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            maxDate={today}
            onError={(err) => setDateError(err !== null)}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                inputProps: { 'aria-label': 'Birthday date' },
              },
              popper: {
                sx: {
                  '& .MuiPaper-root': {
                    background: '#1a1a2e',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                  },
                },
              },
            }}
          />
        </Box>

        {/* CTA Button */}
        <Button
          variant="contained"
          size="large"
          onClick={handleSearch}
          disabled={!isValidDate || disabled}
          aria-label="Search pi for your birthday"
          sx={{
            px: 5,
            py: 1.5,
            borderRadius: '50px',
            fontSize: '1.1rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #00d4ff, #b24bff)',
            boxShadow: '0 0 24px rgba(0, 212, 255, 0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            '&:hover:not(:disabled)': {
              transform: 'scale(1.05)',
              boxShadow: '0 0 36px rgba(0, 212, 255, 0.6)',
              background: 'linear-gradient(135deg, #00d4ff, #b24bff)',
            },
            '&:disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          Search π
        </Button>
      </Box>
    </LocalizationProvider>
  )
}
```

- [ ] **Step 2: Smoke-check in browser**

Temporarily render `BirthdayInput` directly in `src/app/page.tsx` (replace all contents with `export default function Home() { return <BirthdayInput onSearch={() => {}} /> }` and add the import). Run `npm run dev` and verify:
- π hero renders and glows
- DatePicker is usable, rejects future dates
- "Search π" button is disabled until date is picked

Revert `page.tsx` to its original scaffold content after checking (do not commit the temporary change).

- [ ] **Step 3: Commit**

```bash
git add src/components/BirthdayInput.tsx
git commit -m "feat: add birthday input component with MUI DatePicker"
```

---

## Chunk 6: Phase 2 Components

### Task 13: PiTriviaTicker

**Files:**
- Create: `src/components/PiTriviaTicker.tsx`

- [ ] **Step 1: Implement PiTriviaTicker.tsx**

```typescript
// src/components/PiTriviaTicker.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PI_TRIVIA, shuffleTrivia } from '@/lib/piTrivia'

interface PiTriviaTickerProps {
  active: boolean  // false = fade out
}

export default function PiTriviaTicker({ active }: PiTriviaTickerProps) {
  const [facts, setFacts] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    setFacts(shuffleTrivia(PI_TRIVIA))
  }, [])

  useEffect(() => {
    if (!active || facts.length === 0) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % facts.length)
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [active, facts])

  const currentFact = facts[currentIndex] ?? ''

  return (
    <Box
      aria-live="polite"
      aria-atomic="true"
      sx={{
        position: 'fixed',
        bottom: { xs: 48, md: 56 }, // above LinearProgress area
        left: 0,
        right: 0,
        height: { xs: 40, md: 48 },
        display: 'flex',
        alignItems: 'center',
        px: 3,
        gap: 1,
        background: 'rgba(10, 10, 26, 0.85)',
        borderTop: '1px solid rgba(0, 212, 255, 0.3)',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        overflow: 'hidden',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s',
      }}
    >
      <Typography
        component="span"
        sx={{
          color: 'var(--neon-blue)',
          fontWeight: 700,
          fontSize: '1rem',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        π
      </Typography>

      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              component="span"
              noWrap
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.8rem', md: '1rem' },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                },
              }}
            >
              {currentFact}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PiTriviaTicker.tsx
git commit -m "feat: add pi trivia ticker with AnimatePresence cross-fade"
```

---

### Task 14: DigitStream Component

**Files:**
- Create: `src/components/DigitStream.tsx`

This is the most complex component. It has two modes:
1. **Scroll mode:** Renders `rowCount` rows of digits, each showing a ~80-char window centered on `visualPosition`
2. **Reveal mode:** (when `matchReveal` is set) Renders a single row of `<span>` elements for the flash animation

- [ ] **Step 1: Implement DigitStream.tsx**

```typescript
// src/components/DigitStream.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import Box from '@mui/material/Box'
import type { NearMiss } from '@/hooks/useScanAnimation'

interface MatchReveal {
  position: number  // 1-based
  matchStr: string
}

interface DigitStreamProps {
  piDigits: string
  visualPosition: number
  nearMiss: NearMiss | null
  matchReveal: MatchReveal | null
  rowCount: number
  cursorProgress: number  // 0–1 within the homing phase; 0 = cursor center-left, stabilizes
}

const WINDOW_SIZE = 80
const HIGHLIGHT_COL = Math.floor(WINDOW_SIZE * 0.6)  // ~60% from left
const STAGGER = 3  // digits offset per row

export default function DigitStream({
  piDigits,
  visualPosition,
  nearMiss,
  matchReveal,
  rowCount,
  cursorProgress,
}: DigitStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nearMissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nearMissActiveRef = useRef(false)

  // Track near-miss state with a timer (300ms display)
  useEffect(() => {
    if (nearMiss) {
      nearMissActiveRef.current = true
      if (nearMissTimerRef.current) clearTimeout(nearMissTimerRef.current)
      nearMissTimerRef.current = setTimeout(() => {
        nearMissActiveRef.current = false
      }, 300)
    }
    return () => {
      if (nearMissTimerRef.current) clearTimeout(nearMissTimerRef.current)
    }
  }, [nearMiss])

  // Canvas-based RAF rendering for scroll mode
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || matchReveal) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const rowH = H / rowCount
    const charW = W / WINDOW_SIZE

    ctx.font = `${Math.floor(rowH * 0.7)}px "JetBrains Mono", monospace`

    for (let row = 0; row < rowCount; row++) {
      const startIdx = Math.max(0, visualPosition - HIGHLIGHT_COL + row * STAGGER)
      const rowY = rowH * row + rowH * 0.75

      for (let col = 0; col < WINDOW_SIZE; col++) {
        const digitIdx = startIdx + col
        const digit = piDigits[digitIdx] ?? ' '
        const x = col * charW

        // Determine color
        const isHighlight = col === HIGHLIGHT_COL && row === Math.floor(rowCount / 2)
        const isNearMiss =
          nearMissActiveRef.current &&
          nearMiss &&
          digitIdx >= nearMiss.startIndex &&
          digitIdx < nearMiss.startIndex + nearMiss.length

        if (isHighlight) {
          ctx.fillStyle = '#39ff14'  // neon green
          ctx.shadowColor = '#39ff14'
          ctx.shadowBlur = 8
        } else if (isNearMiss) {
          ctx.fillStyle = '#ffd700'  // gold near-miss
          ctx.shadowColor = '#ffd700'
          ctx.shadowBlur = 6
        } else {
          const opacity = row === Math.floor(rowCount / 2) ? 0.45 : 0.15 + (row * 0.05)
          ctx.fillStyle = `rgba(255,255,255,${opacity})`
          ctx.shadowBlur = 0
        }

        ctx.fillText(digit, x, rowY)
        ctx.shadowBlur = 0
      }
    }
  }, [piDigits, visualPosition, nearMiss, matchReveal, rowCount])

  // Resize canvas to container
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ro = new ResizeObserver(([entry]) => {
      canvas.width = entry.contentRect.width
      canvas.height = entry.contentRect.height
      renderCanvas()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [renderCanvas])

  // Re-render when position or near-miss changes
  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Cursor x position: sweeps left-to-right during scan, settles at highlight col
  // Cursor sweeps from 0% to the highlight column position across the full animation duration.
  // During homing phase it stays near the highlight column.
  const highlightPct = (HIGHLIGHT_COL / WINDOW_SIZE) * 100
  const cursorX = `${Math.min(cursorProgress, 1) * highlightPct}%`

  // Reveal mode: static DOM with individual spans
  if (matchReveal) {
    const matchIndex0 = matchReveal.position - 1  // 0-based
    const contextStart = Math.max(0, matchIndex0 - 20)
    const contextEnd = Math.min(piDigits.length, matchIndex0 + matchReveal.matchStr.length + 20)
    const displayDigits = piDigits.slice(contextStart, contextEnd)
    const matchOffset = matchIndex0 - contextStart
    const matchLen = matchReveal.matchStr.length

    return (
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: { xs: '1rem', md: '1.4rem' },
          letterSpacing: '0.05em',
          userSelect: 'none',
        }}
      >
        {displayDigits.split('').map((digit, i) => {
          const isMatch = i >= matchOffset && i < matchOffset + matchLen
          return (
            <Box
              key={i}
              component="span"
              sx={{
                display: 'inline-block',
                // 3 flashes = 3 iterations of white→gold→white (0.4s each)
                animation: isMatch ? 'digitFlash 0.4s ease-in-out 3' : undefined,
                color: isMatch ? 'var(--gold)' : undefined,
                opacity: isMatch ? 1 : 0.15,
                textShadow: isMatch ? '0 0 20px var(--gold)' : undefined,
                transition: 'opacity 0.5s ease',
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                  color: isMatch ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
                },
              }}
            >
              {digit}
            </Box>
          )
        })}
      </Box>
    )
  }

  // Scroll mode: canvas
  return (
    <Box
      ref={containerRef}
      sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-hidden="true"
      />
      {/* Scan cursor */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: cursorX,
          width: 2,
          background: 'cyan',
          animation: 'scanPulse 1s ease-in-out infinite',
          pointerEvents: 'none',
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            opacity: 0.5,
          },
        }}
        aria-hidden="true"
      />
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DigitStream.tsx
git commit -m "feat: add digit stream component with canvas RAF renderer"
```

---

### Task 15: ScanAnimation Orchestrator

**Files:**
- Create: `src/components/ScanAnimation.tsx`

- [ ] **Step 1: Implement ScanAnimation.tsx**

```typescript
// src/components/ScanAnimation.tsx
'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import { useTheme, useMediaQuery } from '@mui/material'
import DigitStream from './DigitStream'
import PiTriviaTicker from './PiTriviaTicker'
import type { PiSearchResult } from '@/hooks/usePiSearch'
import { useScanAnimation } from '@/hooks/useScanAnimation'
import { getSearchCandidates } from '@/lib/searchStrategies'

interface ScanAnimationProps {
  piDigits: string
  searchResult: PiSearchResult
  birthday: Date
  onRevealComplete: () => void
}

export default function ScanAnimation({
  piDigits,
  searchResult,
  birthday,
  onRevealComplete,
}: ScanAnimationProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const rowCount = isMobile ? 3 : isTablet ? 5 : 7
  const matchIndex0 = searchResult.position - 1  // 0-based

  const searchCandidates = getSearchCandidates(birthday)

  const { visualPosition, animPhase, progress, nearMiss } = useScanAnimation({
    matchIndex: matchIndex0,
    piDigits,
    searchCandidates,
    onComplete: onRevealComplete,
    enabled: true,
  })

  const isDone = animPhase === 'done'
  const displayPosition = Math.floor(progress * searchResult.position)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'linear-gradient(160deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
      role="region"
      aria-label="Scanning digits of pi"
    >
      {/* Screen-reader announcement */}
      <Box component="span" aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {isDone
          ? `Match found at position ${searchResult.position.toLocaleString()}`
          : `Scanning digit ${displayPosition.toLocaleString()} of 1,000,000`}
      </Box>

      {/* Digit stream takes up main area */}
      <DigitStream
        piDigits={piDigits}
        visualPosition={visualPosition}
        nearMiss={nearMiss}
        matchReveal={isDone ? { position: searchResult.position, matchStr: searchResult.matchStr } : null}
        rowCount={rowCount}
        cursorProgress={progress}
      />

      {/* Trivia ticker */}
      <PiTriviaTicker active={!isDone} />

      {/* Progress area */}
      <Box
        sx={{
          px: 3,
          pb: 2,
          pt: 1,
          height: { xs: 48, md: 56 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(10,10,26,0.8)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', mb: 0.5, fontFamily: 'monospace' }}
        >
          Scanning digit {displayPosition.toLocaleString()} of 1,000,000
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress * 100}
          sx={{
            height: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-purple))',
            },
          }}
        />
      </Box>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScanAnimation.tsx
git commit -m "feat: add scan animation orchestrator component"
```

---

## Chunk 7: Phase 3 Components

### Task 16: ConfettiExplosion

**Files:**
- Create: `src/components/ConfettiExplosion.tsx`

- [ ] **Step 1: Implement ConfettiExplosion.tsx**

```typescript
// src/components/ConfettiExplosion.tsx
'use client'

import { useEffect, useRef } from 'react'

export default function ConfettiExplosion() {
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    // Dynamically import canvas-confetti to keep it out of initial bundle
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default
      const colors = ['#ffd700', '#00d4ff', '#ff2d95', '#ffffff', '#b24bff']

      // First burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors,
      })

      // Second burst with delay
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        })
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        })
      }, 300)
    })
  }, [])

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ConfettiExplosion.tsx
git commit -m "feat: add confetti explosion component with dynamic import"
```

---

### Task 17: ResultCard Component

**Files:**
- Create: `src/components/ResultCard.tsx`

- [ ] **Step 1: Implement ResultCard.tsx**

```typescript
// src/components/ResultCard.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import { motion } from 'framer-motion'
import ConfettiExplosion from './ConfettiExplosion'
import { getFunFact } from '@/lib/funFacts'
import type { PiSearchResult } from '@/hooks/usePiSearch'

interface ResultCardProps {
  result: PiSearchResult
  piDigits: string
  onReset: () => void
}

function useCountUp(target: number, duration = 1200): number {
  const [count, setCount] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return count
}

export default function ResultCard({ result, piDigits, onReset }: ResultCardProps) {
  const [toastOpen, setToastOpen] = useState(false)
  const animatedPosition = useCountUp(result.position)
  const funFact = getFunFact(result.position)

  // Build 40-digit context display
  const matchIndex0 = result.position - 1
  const contextStart = Math.max(0, matchIndex0 - 18)
  const contextEnd = Math.min(piDigits.length, matchIndex0 + result.matchStr.length + 18)
  const contextDigits = piDigits.slice(contextStart, contextEnd)
  const matchOffset = matchIndex0 - contextStart

  const handleShare = async () => {
    const url = window.location.href
    const text = `My birthday is hiding at position ${result.position.toLocaleString()} in π! Find yours at ${url} #PiDay`
    try {
      await navigator.clipboard.writeText(text)
      setToastOpen(true)
    } catch {
      // Fallback for browsers that block clipboard API
      prompt('Copy this text:', text)
    }
  }

  // Badge color per match type
  const badgeColor =
    result.matchType === 'full-mmddyyyy' || result.matchType === 'full-ddmmyyyy'
      ? { bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.4)', color: '#ffd700' }
      : result.matchType === 'month-day-mmdd' || result.matchType === 'month-day-mmddyy'
      ? { bg: 'rgba(0,212,255,0.15)', border: 'rgba(0,212,255,0.4)', color: '#00d4ff' }
      : { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.3)', color: '#aaaaaa' }

  return (
    <>
      <ConfettiExplosion />

      {/* Screen-reader announcement */}
      <Box
        role="status"
        aria-live="assertive"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {`Match found at position ${result.position.toLocaleString()} in pi! ${result.label}`}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 70%)',
          px: 3,
          py: 6,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 560 }}
        >
          <Box
            sx={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.15), 0 0 80px rgba(178, 75, 255, 0.1)',
              p: { xs: 3, md: 5 },
            }}
          >
            {/* Primary message */}
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 800, textAlign: 'center', mb: 0.5, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
            >
              Your birthday appears at position
            </Typography>
            <Typography
              variant="h2"
              component="p"
              sx={{
                fontWeight: 900,
                textAlign: 'center',
                color: 'var(--gold)',
                textShadow: '0 0 20px rgba(255,215,0,0.4)',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                mb: 2,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              {animatedPosition.toLocaleString()}
            </Typography>

            {/* Digit context strip */}
            <Box
              sx={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                p: 1.5,
                mb: 2,
                overflowX: 'auto',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: { xs: '0.85rem', md: '1rem' },
                letterSpacing: '0.05em',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
              aria-label={`Pi digits context: ...${result.contextBefore}[${result.matchStr}]${result.contextAfter}...`}
            >
              <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)' }}>…</Box>
              <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                {contextDigits.slice(0, matchOffset)}
              </Box>
              <Box
                component="span"
                sx={{
                  color: 'var(--gold)',
                  textShadow: '0 0 12px var(--gold)',
                  fontWeight: 700,
                  fontSize: '1.1em',
                }}
              >
                {result.matchStr}
              </Box>
              <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                {contextDigits.slice(matchOffset + result.matchStr.length)}
              </Box>
              <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)' }}>…</Box>
            </Box>

            {/* Badge */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box
                component="span"
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: badgeColor.bg,
                  border: `1px solid ${badgeColor.border}`,
                  color: badgeColor.color,
                }}
              >
                {result.label}
              </Box>
            </Box>

            {/* Fun fact */}
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', textAlign: 'center', mb: 3, lineHeight: 1.6 }}
            >
              {funFact}
            </Typography>

            {/* Share button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleShare}
              aria-label="Copy shareable message to clipboard"
              sx={{
                mb: 1.5,
                py: 1.5,
                borderRadius: '50px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                color: '#000',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ffe033, #ff9d1a)',
                  transform: 'scale(1.02)',
                },
              }}
            >
              📤 Share Your Pi Position
            </Button>

            {/* Try again */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={onReset}
              aria-label="Try another birthday"
              sx={{
                py: 1.5,
                borderRadius: '50px',
                borderColor: 'rgba(0, 212, 255, 0.4)',
                color: 'var(--neon-blue)',
                '&:hover': {
                  borderColor: 'var(--neon-blue)',
                  backgroundColor: 'rgba(0, 212, 255, 0.08)',
                },
              }}
            >
              Try Another Birthday
            </Button>
          </Box>
        </motion.div>
      </Box>

      <Snackbar
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Copied to clipboard! 🎉"
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultCard.tsx
git commit -m "feat: add result card with animated counter, share, and confetti"
```

---

## Chunk 8: Page Orchestration + Final Build

### Task 18: Main Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement page.tsx**

```typescript
// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { AnimatePresence, motion } from 'framer-motion'
import FloatingDigits from '@/components/FloatingDigits'
import BirthdayInput from '@/components/BirthdayInput'
import ScanAnimation from '@/components/ScanAnimation'
import ResultCard from '@/components/ResultCard'
import { loadPiDigits } from '@/lib/piLoader'
import { searchPiDigits, type PiSearchResult } from '@/hooks/usePiSearch'

type Phase = 'input' | 'scanning' | 'result'

// Framer Motion variants for phase transitions
const phaseVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.02, transition: { duration: 0.3 } },
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input')
  const [piDigits, setPiDigits] = useState<string | null>(null)
  const [piError, setPiError] = useState(false)
  const [birthday, setBirthday] = useState<Date | null>(null)
  const [searchResult, setSearchResult] = useState<PiSearchResult | null>(null)

  // Load pi digits on mount
  useEffect(() => {
    loadPiDigits()
      .then((digits) => setPiDigits(digits))
      .catch(() => setPiError(true))
  }, [])

  const handleSearch = (date: Date) => {
    if (!piDigits) return
    let result = searchPiDigits(piDigits, date)

    // Ultimate fallback: if no birthday pattern found (very rare), find the
    // zero-padded month string anywhere — guaranteed to exist in 1M digits
    if (!result) {
      const month = date.getMonth() + 1
      const mm = String(month).padStart(2, '0')
      const idx = piDigits.indexOf(mm)
      const safeIdx = idx >= 0 ? idx : 0
      result = {
        position: safeIdx + 1,
        matchType: 'partial-md',
        label: '🔍 Partial Match',
        matchStr: mm,
        contextBefore: piDigits.slice(Math.max(0, safeIdx - 20), safeIdx),
        contextAfter: piDigits.slice(safeIdx + 2, safeIdx + 22),
      }
    }

    setBirthday(date)
    setSearchResult(result)
    setPhase('scanning')
  }

  const handleRevealComplete = () => {
    setPhase('result')
  }

  const handleReset = () => {
    setPhase('input')
    setBirthday(null)
    setSearchResult(null)
  }

  // Loading / error state (pi digits not ready)
  if (piError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          gap: 3,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Looks like π is being irrational today.
        </Typography>
        <Typography color="text.secondary">
          Please refresh and try again.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => { setPiError(false); loadPiDigits().then(setPiDigits).catch(() => setPiError(true)) }}
          sx={{ borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)' }}
        >
          Retry
        </Button>
      </Box>
    )
  }

  // While pi digits are loading, show pulsing π
  if (!piDigits && phase === 'input') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: '80px',
            fontWeight: 900,
            animation: 'piGlow 2s ease-in-out infinite',
            color: 'var(--neon-blue)',
          }}
          aria-label="Loading pi digits"
        >
          π
        </Typography>
        <Typography color="text.secondary">Loading digits of π…</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <FloatingDigits />

      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.div key="input" {...phaseVariants} style={{ position: 'relative', zIndex: 1 }}>
            <BirthdayInput
              onSearch={handleSearch}
              disabled={!piDigits}
            />
          </motion.div>
        )}

        {phase === 'scanning' && piDigits && searchResult && birthday && (
          <motion.div key="scanning" {...phaseVariants} style={{ position: 'relative', zIndex: 1 }}>
            <ScanAnimation
              piDigits={piDigits}
              searchResult={searchResult}
              birthday={birthday}
              onRevealComplete={handleRevealComplete}
            />
          </motion.div>
        )}

        {phase === 'result' && piDigits && searchResult && (
          <motion.div key="result" {...phaseVariants} style={{ position: 'relative', zIndex: 1 }}>
            <ResultCard
              result={searchResult}
              piDigits={piDigits}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add main page phase state machine with AnimatePresence"
```

---

### Task 19: Final Build Verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (searchStrategies, funFacts, usePiSearch).

- [ ] **Step 2: Run ESLint**

```bash
npm run lint
```

Fix any errors. Common: unused imports, missing `'use client'` directives, any/unknown type errors.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no errors. Warnings about `canvas-confetti` import size are acceptable.

If build fails:
- `Module not found` errors: check `@/` alias resolves correctly in `tsconfig.json` (`"paths": { "@/*": ["./src/*"] }`)
- MUI SSR errors: ensure `'use client'` is on all components that use hooks or browser APIs
- `canvas-confetti` type error: verify `@types/canvas-confetti` is installed

- [ ] **Step 4: Run production server and do manual QA**

```bash
npm start
```

Open http://localhost:3000. Run through the testing checklist:

**Phase 1:**
- [ ] Floating digits visible in background
- [ ] π hero pulses with color-cycling glow
- [ ] DatePicker works, no future dates selectable
- [ ] "Search π" button disabled until valid date entered
- [ ] Button enables after date selected

**Phase 2:**
- [ ] Digit stream scrolls from left to right
- [ ] Scan cursor (cyan line) visible and pulsing
- [ ] Progress counter increments
- [ ] Trivia ticker shows facts, cycling every ~3s
- [ ] Animation completes in 4–8 seconds
- [ ] At least 2 trivia facts shown

**Phase 3:**
- [ ] Confetti fires
- [ ] Digit stream freezes on match region, matched digits flash gold
- [ ] Result card slides up after ~1.5s
- [ ] Position counter animates 0→N
- [ ] Digit context strip shows match in gold
- [ ] Match type badge correct color
- [ ] Share button copies to clipboard, toast appears
- [ ] "Try Another Birthday" returns to Phase 1

**Specific dates to test:**
- July 4, 1990: should find `07041990` or `0704` or `74`
- January 1, 2000: should find `01012000` or `0101`
- February 29 (any year): accepted by picker, search runs normally

**Mobile QA** (open DevTools → 375px width):
- [ ] π hero scales to ~120px
- [ ] 2-3 digit rows visible
- [ ] Trivia ticker readable (14px, truncates with ellipsis)
- [ ] Result card full-width

**Reduced motion** (OS setting or Chrome DevTools → Rendering → Emulate CSS media):
- [ ] No animation on phase transitions (instant)
- [ ] Trivia swaps without slide
- [ ] Digit flash still shows gold color (no animation)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete pi birthday finder app

- 3-phase state machine: input → scanning → result
- RAF-driven digit stream with speed ramp and near-miss flashes
- Trivia ticker with AnimatePresence cross-fade
- canvas-confetti celebration on match reveal
- Glassmorphism result card with animated position counter
- Full responsive design (mobile/tablet/desktop)
- Accessibility: aria-live regions, prefers-reduced-motion support"
```

---

## Quick Reference

**Run dev server:** `npm run dev` (from `pi-birthday-finder/`)
**Run tests:** `npm test`
**Build:** `npm run build`
**Re-download pi digits:** `node scripts/download-pi.js`
