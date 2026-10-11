import { useEffect, useRef } from 'react'

function lerp(a, b, t) {
  return a + (b - a) * t
}

const FRICTION = 0.985

export default function useBurst({ stageRef, posterRefs, count, sizeRef, active, speed = 1, transformsRef }) {
  const positionsRef = useRef([])
  const velocitiesRef = useRef([])
  const rotationsRef = useRef([])
  const angularVelocitiesRef = useRef([])
  const pairActiveRef = useRef([])
  const followSpeedRef = useRef([])
  const burstRef = useRef(false)
  const speedRef = useRef(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    positionsRef.current = Array.from({ length: count }, () => ({ x: cx, y: cy }))
    velocitiesRef.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }))
    rotationsRef.current = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? 1 : -1) * i * 0.9)
    angularVelocitiesRef.current = Array.from({ length: count }, () => 0)
    pairActiveRef.current = Array.from({ length: count }, () => Array(count).fill(false))
    followSpeedRef.current = Array.from({ length: count }, () => 0.04 + Math.random() * 0.14)
    burstRef.current = false
  }, [count, stageRef])

  useEffect(() => {
    if (!active) return
    const stage = stageRef.current
    if (!stage) return

    const mouseRef = { x: stage.getBoundingClientRect().width / 2, y: stage.getBoundingClientRect().height / 2 }
    const handleMouseMove = (e) => {
      const rect = stage.getBoundingClientRect()
      mouseRef.x = e.clientX - rect.left
      mouseRef.y = e.clientY - rect.top
    }
    stage.addEventListener('mousemove', handleMouseMove)

    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return
      const target = e.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      e.preventDefault()

      burstRef.current = !burstRef.current

      if (burstRef.current) {
        velocitiesRef.current = Array.from({ length: count }, () => {
          const angle = Math.random() * Math.PI * 2
          const speedMag = (14 + Math.random() * 14) * speedRef.current
          return { x: Math.cos(angle) * speedMag, y: Math.sin(angle) * speedMag }
        })
        angularVelocitiesRef.current = Array.from(
          { length: count },
          () => (Math.random() * 6 - 3) * speedRef.current,
        )
        pairActiveRef.current = Array.from({ length: count }, () => Array(count).fill(false))
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    let raf
    const tick = () => {
      const positions = positionsRef.current
      const velocities = velocitiesRef.current
      const { width, height } = sizeRef.current
      const rect = stage.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      const minX = width / 2
      const maxX = rect.width - width / 2
      const minY = height / 2
      const maxY = rect.height - height / 2

      const angularVelocities = angularVelocitiesRef.current
      const pairActive = pairActiveRef.current

      for (let i = 0; i < count; i++) {
        if (burstRef.current) {
          velocities[i].x *= FRICTION
          velocities[i].y *= FRICTION
          angularVelocities[i] *= FRICTION

          positions[i].x += velocities[i].x
          positions[i].y += velocities[i].y
          rotationsRef.current[i] += angularVelocities[i]

          if (positions[i].x < minX) {
            positions[i].x = minX
            velocities[i].x *= -1
            angularVelocities[i] *= -1
          } else if (positions[i].x > maxX) {
            positions[i].x = maxX
            velocities[i].x *= -1
            angularVelocities[i] *= -1
          }

          if (positions[i].y < minY) {
            positions[i].y = minY
            velocities[i].y *= -1
            angularVelocities[i] *= -1
          } else if (positions[i].y > maxY) {
            positions[i].y = maxY
            velocities[i].y *= -1
            angularVelocities[i] *= -1
          }
        } else {
          const t = followSpeedRef.current[i] ?? 0.1
          positions[i].x = lerp(positions[i].x, mouseRef.x, t)
          positions[i].y = lerp(positions[i].y, mouseRef.y, t)
          angularVelocities[i] *= FRICTION
          rotationsRef.current[i] += angularVelocities[i]
        }
      }

      if (burstRef.current) {
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const dx = positions[j].x - positions[i].x
            const dy = positions[j].y - positions[i].y
            const overlapX = width - Math.abs(dx)
            const overlapY = height - Math.abs(dy)
            const overlapping = overlapX > 0 && overlapY > 0

            if (!pairActive[i][j]) {
              if (!overlapping) pairActive[i][j] = true
              continue
            }

            if (overlapping) {
              if (overlapX < overlapY) {
                const sign = dx >= 0 ? 1 : -1
                const push = (overlapX / 2) * sign
                positions[i].x -= push
                positions[j].x += push

                const diff = velocities[j].x - velocities[i].x
                velocities[i].x += diff
                velocities[j].x -= diff

                angularVelocities[i] -= diff * 0.15
                angularVelocities[j] += diff * 0.15
              } else {
                const sign = dy >= 0 ? 1 : -1
                const push = (overlapY / 2) * sign
                positions[i].y -= push
                positions[j].y += push

                const diff = velocities[j].y - velocities[i].y
                velocities[i].y += diff
                velocities[j].y -= diff

                angularVelocities[i] -= diff * 0.15
                angularVelocities[j] += diff * 0.15
              }
            }
          }
        }
      }

      for (let i = 0; i < count; i++) {
        const rotation = rotationsRef.current[i] ?? 0

        const el = posterRefs.current[i]
        if (el) {
          el.style.transform = `translate(${positions[i].x - width / 2}px, ${positions[i].y - height / 2}px) rotate(${rotation}deg)`
        }

        if (transformsRef) {
          transformsRef.current[i] = { x: positions[i].x, y: positions[i].y, rotation }
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      stage.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(raf)
    }
  }, [count, stageRef, posterRefs, active, sizeRef])
}
