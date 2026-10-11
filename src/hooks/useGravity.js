import { useEffect, useRef } from 'react'

const FRICTION = 0.99
const BOUNCE = 0.5
const GRAVITY = 0.5

export default function useGravity({ stageRef, posterRefs, count, sizeRef, active, speed = 0.5, transformsRef }) {
  const positionsRef = useRef([])
  const velocitiesRef = useRef([])
  const rotationsRef = useRef([])
  const angularVelocitiesRef = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const speedRef = useRef(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const { width, height } = sizeRef.current
    const minX = width / 2
    const maxX = Math.max(minX, rect.width - width / 2)

    positionsRef.current = Array.from({ length: count }, () => ({
      x: minX + Math.random() * (maxX - minX),
      y: -height - Math.random() * rect.height * 1.2,
    }))
    velocitiesRef.current = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 4,
      y: Math.random() * 2,
    }))
    rotationsRef.current = Array.from({ length: count }, () => 0)
    angularVelocitiesRef.current = Array.from({ length: count }, () => 0)
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
      const rect = stage.getBoundingClientRect()
      const positions = positionsRef.current
      const velocities = velocitiesRef.current
      const rotations = rotationsRef.current
      const angularVelocities = angularVelocitiesRef.current

      const minX = width / 2
      const maxX = rect.width - width / 2
      const maxY = rect.height - height / 2
      const attractRadius = Math.max(width, height) * 2

      for (let i = 0; i < count; i++) {
        const dx = mouseRef.current.x - positions[i].x
        const dy = mouseRef.current.y - positions[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < attractRadius && dist > 0.01) {
          const pull = ((attractRadius - dist) / attractRadius) * speedRef.current * 1.2
          velocities[i].x += (dx / dist) * pull
          velocities[i].y += (dy / dist) * pull
        } else {
          velocities[i].y += GRAVITY
        }

        velocities[i].x *= FRICTION
        velocities[i].y *= FRICTION
        angularVelocities[i] *= FRICTION

        positions[i].x += velocities[i].x
        positions[i].y += velocities[i].y
        rotations[i] += angularVelocities[i]

        if (positions[i].x < minX) {
          positions[i].x = minX
          velocities[i].x *= -BOUNCE
          angularVelocities[i] += velocities[i].y * 0.05
        } else if (positions[i].x > maxX) {
          positions[i].x = maxX
          velocities[i].x *= -BOUNCE
          angularVelocities[i] -= velocities[i].y * 0.05
        }

        if (positions[i].y > maxY) {
          positions[i].y = maxY
          velocities[i].y *= -BOUNCE
          angularVelocities[i] += velocities[i].x * 0.05
        }

        const el = posterRefs.current[i]
        if (el) {
          el.style.transform = `translate(${positions[i].x - width / 2}px, ${positions[i].y - height / 2}px) rotate(${rotations[i]}deg)`
        }

        if (transformsRef) {
          transformsRef.current[i] = { x: positions[i].x, y: positions[i].y, rotation: rotations[i] }
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
