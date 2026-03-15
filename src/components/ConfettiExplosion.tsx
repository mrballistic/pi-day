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
