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
