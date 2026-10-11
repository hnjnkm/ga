import { useEffect, useRef, useState } from 'react'

export default function useTrail({ stageRef, posterRefs, count, imagesLength, sizeRef, active, speed = 0.22, transformsRef }) {
  const positionsRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const speedRef = useRef(speed)
  const [cycleOffset, setCycleOffset] = useState(0)

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
    mouseRef.current = { x: cx, y: cy }
  }, [count, stageRef])

  useEffect(() => {
    if (!active) return
    const stage = stageRef.current
    if (!stage) return

    const handleMove = (e) => {
      const rect = stage.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    window.addEventListener('mousemove', handleMove)

    let raf
    const tick = () => {
      const positions = positionsRef.current
      const { width, height } = sizeRef.current
      const leaderSpeed = speedRef.current
      const followerSpeed = leaderSpeed * (0.16 / 0.22)

      for (let i = 0; i < count; i++) {
        const target = i === 0 ? mouseRef.current : positions[i - 1]
        const lerpFactor = i === 0 ? leaderSpeed : followerSpeed
        positions[i].x += (target.x - positions[i].x) * lerpFactor
        positions[i].y += (target.y - positions[i].y) * lerpFactor

        const rotation = (i % 2 === 0 ? 1 : -1) * i * 0.9

        const el = posterRefs.current[i]
        if (el) {
          el.style.transform = `translate(${positions[i].x - width / 2}px, ${positions[i].y - height / 2}px) rotate(${rotation}deg)`
        }

        if (transformsRef) {
          transformsRef.current[i] = { x: positions[i].x, y: positions[i].y, rotation }
        }
      }

      frameRef.current += 1
      if (frameRef.current % 30 === 0 && imagesLength > 0) {
        setCycleOffset((prev) => (prev + 1) % imagesLength)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(raf)
    }
  }, [count, stageRef, posterRefs, imagesLength, sizeRef, active])

  return { cycleOffset }
}
