import { useEffect, useRef } from 'react'

const FRICTION = 0.9

export default function useRepel({ stageRef, posterRefs, count, sizeRef, active, speed = 0.5, transformsRef }) {
  const positionsRef = useRef([])
  const homePositionsRef = useRef([])
  const velocitiesRef = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const speedRef = useRef(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    const cellW = rect.width / cols
    const cellH = rect.height / rows

    const homes = Array.from({ length: count }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return { x: cellW * (col + 0.5), y: cellH * (row + 0.5) }
    })
    homePositionsRef.current = homes
    positionsRef.current = homes.map((p) => ({ ...p }))
    velocitiesRef.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }))
  }, [count, stageRef])

  useEffect(() => {
    if (!active) return
    const stage = stageRef.current
    if (!stage) return

    const handleMove = (e) => {
      const rect = stage.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseout', handleLeave)

    let raf
    const tick = () => {
      const { width, height } = sizeRef.current
      const positions = positionsRef.current
      const homes = homePositionsRef.current
      const velocities = velocitiesRef.current
      const repelRadius = Math.max(width, height) * 1.5

      for (let i = 0; i < count; i++) {
        const dx = positions[i].x - mouseRef.current.x
        const dy = positions[i].y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < repelRadius && dist > 0.01) {
          const force = ((repelRadius - dist) / repelRadius) * speedRef.current * 6
          velocities[i].x += (dx / dist) * force
          velocities[i].y += (dy / dist) * force
        }

        velocities[i].x += (homes[i].x - positions[i].x) * 0.01
        velocities[i].y += (homes[i].y - positions[i].y) * 0.01

        velocities[i].x *= FRICTION
        velocities[i].y *= FRICTION

        positions[i].x += velocities[i].x
        positions[i].y += velocities[i].y

        const rotation = velocities[i].x * 3

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
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseout', handleLeave)
      cancelAnimationFrame(raf)
    }
  }, [count, stageRef, posterRefs, sizeRef, active])
}
