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

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

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
