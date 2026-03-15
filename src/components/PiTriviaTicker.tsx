// src/components/PiTriviaTicker.tsx
'use client'

import { memo, useEffect, useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PI_TRIVIA, shuffleTrivia } from '@/lib/piTrivia'

interface PiTriviaTickerProps {
  active: boolean  // false = fade out
}

export default memo(function PiTriviaTicker({ active }: PiTriviaTickerProps) {
  const [facts] = useState<string[]>(() => shuffleTrivia(PI_TRIVIA))
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prefersReducedMotion = useReducedMotion()

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
})
