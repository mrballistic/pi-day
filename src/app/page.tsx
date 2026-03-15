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
