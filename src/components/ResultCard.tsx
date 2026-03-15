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
    result.matchType === 'full-mmddyyyy'
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
