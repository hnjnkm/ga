import { useEffect, useRef } from 'react'

const MIN_RADIUS_SCALE = 0.1
const MAX_RADIUS_SCALE = 2

export default function useOrbit({
  stageRef,
  posterRefs,
  count,
  sizeRef,
  active,
  speed = 0.5,
  radiusScale = 1,
  onRadiusChange,
  transformsRef,
}) {
  const baseAngleRef = useRef(0)
  const directionRef = useRef(0)
  const wobbleSeedsRef = useRef([])
  const angleOffsetsRef = useRef([])
  const followFactorsRef = useRef([])
  const spinSpeedsRef = useRef([])
  const noiseVelRef = useRef([])
  const perturbRef = useRef([])
  const clickWeightsRef = useRef([])
  const positionsRef = useRef([])
  const rotationsRef = useRef([])
  const centerRef = useRef({ x: 0, y: 0 })
  const mouseRef = useRef({ x: 0, y: 0 })
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const latestBaseRadiusRef = useRef(0)
  const speedRef = useRef(speed)
  const radiusScaleRef = useRef(radiusScale)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    radiusScaleRef.current = radiusScale
  }, [radiusScale])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const angleStep = (Math.PI * 2) / count
    baseAngleRef.current = 0
    directionRef.current = 0
    wobbleSeedsRef.current = Array.from({ length: count }, () => Math.random() * Math.PI * 2)
    angleOffsetsRef.current = Array.from({ length: count }, () => (Math.random() - 0.5) * angleStep * 0.7)
    followFactorsRef.current = Array.from({ length: count }, () => 0.04 + Math.random() * 0.1)
    spinSpeedsRef.current = Array.from({ length: count }, () => (Math.random() - 0.5) * 1.2)
    noiseVelRef.current = Array.from({ length: count }, () => ({ angle: 0, radius: 0 }))
    perturbRef.current = Array.from({ length: count }, () => ({ angle: 0, radius: 0 }))
    clickWeightsRef.current = Array.from({ length: count }, () => 0.4 + Math.random() * 1.6)
    rotationsRef.current = Array.from({ length: count }, () => Math.random() * 360)

    const baseRadius = Math.max(rect.width, rect.height) * (0.75 + count * 0.16) * radiusScaleRef.current
    positionsRef.current = Array.from({ length: count }, (_, i) => {
      const angle = i * angleStep + angleOffsetsRef.current[i]
      return { x: cx + Math.cos(angle) * baseRadius, y: cy + Math.sin(angle) * baseRadius }
    })

    centerRef.current = { x: cx, y: cy }
    mouseRef.current = { x: cx, y: cy }
    prevMouseRef.current = { x: cx, y: cy }
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

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      onRadiusChange?.((prev) => {
        const next = Math.round((prev + delta) * 100) / 100
        return Math.min(MAX_RADIUS_SCALE, Math.max(MIN_RADIUS_SCALE, next))
      })
    }
    stage.addEventListener('wheel', handleWheel, { passive: false })

    const handleClick = () => {
      const noiseVel = noiseVelRef.current
      const weights = clickWeightsRef.current
      for (let i = 0; i < count; i++) {
        const w = weights[i]
        noiseVel[i].radius += latestBaseRadiusRef.current * (3 + Math.random() * 3) * w
        noiseVel[i].angle += (Math.random() - 0.5) * 2.5 * w
      }
    }
    window.addEventListener('mousedown', handleClick)

    let raf
    const tick = () => {
      const { width, height } = sizeRef.current
      const center = centerRef.current
      const wobbleSeeds = wobbleSeedsRef.current
      const angleOffsets = angleOffsetsRef.current
      const followFactors = followFactorsRef.current
      const spinSpeeds = spinSpeedsRef.current
      const noiseVel = noiseVelRef.current
      const perturb = perturbRef.current
      const positions = positionsRef.current
      const rotations = rotationsRef.current

      center.x += (mouseRef.current.x - center.x) * 0.08
      center.y += (mouseRef.current.y - center.y) * 0.08

      const dx = mouseRef.current.x - prevMouseRef.current.x
      const dy = mouseRef.current.y - prevMouseRef.current.y
      const mouseSpeed = Math.sqrt(dx * dx + dy * dy)
      prevMouseRef.current = { x: mouseRef.current.x, y: mouseRef.current.y }

      const frame = frameRef.current
      frameRef.current += 1

      const baseRadius = Math.max(width, height) * (0.75 + count * 0.16) * radiusScaleRef.current
      latestBaseRadiusRef.current = baseRadius
      const angleStep = (Math.PI * 2) / count

      directionRef.current += (Math.random() - 0.5) * 0.012
      directionRef.current = Math.max(-0.5, Math.min(0.5, directionRef.current))
      const drift = 1 + Math.sin(frame * 0.003) * 0.3 + directionRef.current * 0.3

      const angularSpeed = speedRef.current * 0.018 * drift
      baseAngleRef.current += angularSpeed

      for (let i = 0; i < count; i++) {
        noiseVel[i].angle += (Math.random() - 0.5) * 0.0015
        noiseVel[i].radius += (Math.random() - 0.5) * 0.4
        if (mouseSpeed > 1) {
          noiseVel[i].angle += (Math.random() - 0.5) * mouseSpeed * 0.0008
          noiseVel[i].radius += (Math.random() - 0.5) * mouseSpeed * 0.4
        }
        noiseVel[i].angle *= 0.9
        noiseVel[i].radius *= 0.9

        perturb[i].angle += noiseVel[i].angle
        perturb[i].radius += noiseVel[i].radius
        perturb[i].angle *= 0.78
        perturb[i].radius *= 0.72

        perturb[i].angle = Math.max(-0.4, Math.min(0.4, perturb[i].angle))
        perturb[i].radius = Math.max(-baseRadius * 0.3, Math.min(baseRadius * 0.3, perturb[i].radius))

        const angle = baseAngleRef.current + i * angleStep + angleOffsets[i] + perturb[i].angle
        const radius = baseRadius * (1 + Math.sin(frame * 0.02 + wobbleSeeds[i]) * 0.12) + perturb[i].radius

        const targetX = center.x + Math.cos(angle) * radius
        const targetY = center.y + Math.sin(angle) * radius

        positions[i].x += (targetX - positions[i].x) * followFactors[i]
        positions[i].y += (targetY - positions[i].y) * followFactors[i]

        rotations[i] += spinSpeeds[i]

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
      window.removeEventListener('mousedown', handleClick)
      stage.removeEventListener('wheel', handleWheel)
      cancelAnimationFrame(raf)
    }
  }, [count, stageRef, posterRefs, sizeRef, active, onRadiusChange])
}
