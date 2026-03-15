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
  cursorProgress: number  // 0–1 within the full animation; drives cursor sweep
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
