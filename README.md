# Pi Day Birthday Finder

A flashy single-page app that finds your birthday in the digits of π, with a dramatic scanning animation and celebration reveal.

Enter your birthday, watch a sci-fi digit scan through 1 million digits of pi, and discover exactly where your birthday hides.

**[Try it live →](https://pi-day-seven.vercel.app)**

## Features

- Searches 1,000,000 digits of π for your birthday
- Animated digit stream with speed ramp (slow → fast → homing)
- Near-miss flashes and a glowing scan cursor
- Pi trivia ticker with cross-fade facts during the scan
- Confetti celebration on match reveal
- Animated position counter and shareable result
- Full responsive design (mobile / tablet / desktop)
- Accessibility: `aria-live` regions, `prefers-reduced-motion` support

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [MUI v7](https://mui.com) + Emotion
- [Framer Motion](https://www.framer.com/motion/)
- [canvas-confetti](https://github.com/catdad/canvas-confetti)
- [date-fns](https://date-fns.org)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Build for production

```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

Tests cover search strategies, fun facts, and the pi search hook.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout: ThemeProvider, fonts
│   ├── page.tsx            # Phase state machine (input → scanning → result)
│   └── globals.css         # CSS custom properties, keyframes
├── components/
│   ├── BirthdayInput.tsx   # Phase 1: date picker + CTA
│   ├── ScanAnimation.tsx   # Phase 2: digit stream + trivia + progress
│   ├── DigitStream.tsx     # Canvas RAF renderer + reveal span mode
│   ├── PiTriviaTicker.tsx  # Rotating pi facts with AnimatePresence
│   ├── ResultCard.tsx      # Phase 3: glassmorphism card + share
│   ├── ConfettiExplosion.tsx
│   └── FloatingDigits.tsx  # Ambient background particles
├── hooks/
│   ├── usePiSearch.ts      # indexOf search, returns PiSearchResult
│   └── useScanAnimation.ts # RAF loop, speed ramp, near-miss detection
├── lib/
│   ├── piLoader.ts         # Async fetch + cache pi digits
│   ├── searchStrategies.ts # Date → priority-ordered search patterns
│   ├── piTrivia.ts         # 24 verified pi facts + Fisher-Yates shuffle
│   └── funFacts.ts         # Position-based fun fact generator
└── theme/
    └── theme.ts            # MUI dark theme, neon palette
```

## License

MIT — see [LICENSE](LICENSE)
