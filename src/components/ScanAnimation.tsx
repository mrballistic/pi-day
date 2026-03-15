// src/components/ScanAnimation.tsx
'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import { useTheme, useMediaQuery } from '@mui/material'
import { useMemo } from 'react'
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

  const searchCandidates = useMemo(() => getSearchCandidates(birthday), [birthday])

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
              transition: 'none',  // RAF drives updates at 60fps; CSS transition on top causes jitter
            },
          }}
        />
      </Box>
    </Box>
  )
}
