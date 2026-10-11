import { useEffect, useRef } from 'react'

const HOLD_INTERVAL = 80

export default function useCut({ images, active, speed = 2, autoMode = true, onIndexChange }) {
  const indexRef = useRef(0)
  const speedRef = useRef(speed)
  const autoModeRef = useRef(autoMode)
  const lastAdvanceRef = useRef(0)
  const holdRef = useRef(false)
  const lastHoldAdvanceRef = useRef(0)

  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { autoModeRef.current = autoMode }, [autoMode])

  useEffect(() => {
    if (!active || images.length === 0) return

    indexRef.current = 0
    onIndexChange(0)

    const advance = () => {
      const next = (indexRef.current + 1) % images.length
      indexRef.current = next
      onIndexChange(next)
    }

    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      e.preventDefault()
      if (autoModeRef.current) return
      if (!e.repeat) {
        advance()
        lastHoldAdvanceRef.current = performance.now()
      }
      holdRef.current = true
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') holdRef.current = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let raf
    const tick = (now) => {
      if (autoModeRef.current && images.length > 1) {
        const interval = 1000 / speedRef.current
        if (now - lastAdvanceRef.current >= interval) {
          lastAdvanceRef.current = now
          advance()
        }
      } else if (holdRef.current && !autoModeRef.current) {
        if (now - lastHoldAdvanceRef.current >= HOLD_INTERVAL) {
          lastHoldAdvanceRef.current = now
          advance()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    lastAdvanceRef.current = performance.now()
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(raf)
    }
  }, [active, images, onIndexChange])
}
