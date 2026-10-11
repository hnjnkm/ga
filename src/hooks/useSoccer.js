import { useEffect, useRef } from 'react'

const FORMATION_BASE = [
  { role: 'GK', depth: 0.05, lateral: 0.50 },
  { role: 'DF', depth: 0.18, lateral: 0.12 },
  { role: 'DF', depth: 0.18, lateral: 0.37 },
  { role: 'DF', depth: 0.18, lateral: 0.63 },
  { role: 'DF', depth: 0.18, lateral: 0.88 },
  { role: 'MF', depth: 0.38, lateral: 0.15 },
  { role: 'MF', depth: 0.38, lateral: 0.40 },
  { role: 'MF', depth: 0.38, lateral: 0.60 },
  { role: 'MF', depth: 0.38, lateral: 0.85 },
  { role: 'FW', depth: 0.55, lateral: 0.35 },
  { role: 'FW', depth: 0.55, lateral: 0.65 },
]

// Priority order for trimming the formation down to fewer players per team:
// GK first, then forwards, then central defenders/midfielders, then wide players.
const INCLUDE_ORDER = [0, 9, 10, 2, 6, 1, 3, 5, 7, 8, 4]

// Vertical pitch: team A occupies the top half (goal at y=0, attacks toward y=1),
// team B occupies the bottom half (goal at y=1, attacks toward y=0).
function buildFormation(playersPerTeam) {
  const indices = INCLUDE_ORDER.slice(0, playersPerTeam)
  const base = indices.map((idx) => ({ ...FORMATION_BASE[idx] }))

  const groups = new Map()
  base.forEach((p) => {
    if (!groups.has(p.depth)) groups.set(p.depth, [])
    groups.get(p.depth).push(p)
  })
  groups.forEach((group) => {
    group.sort((a, b) => a.lateral - b.lateral)
    const n = group.length
    group.forEach((p, idx) => {
      p.lateral = n === 1 ? 0.5 : 0.12 + (0.76 * idx) / (n - 1)
    })
  })

  return [
    ...base.map((p) => ({ role: p.role, team: 'A', x: p.lateral, y: p.depth })),
    ...base.map((p) => ({ role: p.role, team: 'B', x: p.lateral, y: 1 - p.depth })),
  ]
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

const ROLE_ADVANCE = { GK: 0.02, DF: 0.08, MF: 0.15, FW: 0.22 }
const ROLE_LATERAL = { GK: 0.04, DF: 0.12, MF: 0.22, FW: 0.28 }
const BOUNCE_DURATION = 220

export default function useSoccer({ stageRef, playerRefs, ballRef, active, posterSize = 6, ballSize = 1.5, passTempo = 1, playersPerTeam = 11 }) {
  const positionsRef = useRef([])
  const jitterRef = useRef([])
  const runRef = useRef([])
  const rotRef = useRef([])
  const kickRef = useRef([])
  const possessionRef = useRef(1)
  const ballAnimRef = useRef(null)
  const ballPosRef = useRef({ x: 0.5, y: 0.5 })
  const nextActionAtRef = useRef(0)
  const lastTimeRef = useRef(0)
  const posterSizeRef = useRef(posterSize)
  const ballSizeRef = useRef(ballSize)
  const tempoRef = useRef(passTempo)

  useEffect(() => {
    posterSizeRef.current = posterSize
  }, [posterSize])

  useEffect(() => {
    ballSizeRef.current = ballSize
  }, [ballSize])

  useEffect(() => {
    tempoRef.current = passTempo
  }, [passTempo])

  useEffect(() => {
    if (!active) return
    const stage = stageRef.current
    if (!stage) return

    const FORMATION = buildFormation(playersPerTeam)
    const total = FORMATION.length

    positionsRef.current = FORMATION.map((p) => ({ x: p.x, y: p.y }))
    jitterRef.current = FORMATION.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }))
    runRef.current = FORMATION.map(() => ({ phase: Math.random() * Math.PI * 2, freq: 0.4 + Math.random() * 0.8 }))
    rotRef.current = FORMATION.map(() => ({ phase: Math.random() * Math.PI * 2, freq: 0.2 + Math.random() * 0.4, amp: 5 + Math.random() * 5 }))
    kickRef.current = FORMATION.map(() => -1000)
    possessionRef.current = 1
    ballPosRef.current = { ...positionsRef.current[1] }

    lastTimeRef.current = 0
    nextActionAtRef.current = performance.now() + 600

    const pickPassTarget = (holderIdx) => {
      const holder = FORMATION[holderIdx]
      const holderPos = positionsRef.current[holderIdx]
      const forwardSign = holder.team === 'A' ? 1 : -1
      const candidates = []
      let totalWeight = 0
      for (let i = 0; i < total; i++) {
        if (i === holderIdx) continue
        if (FORMATION[i].team !== holder.team) continue
        const pos = positionsRef.current[i]
        const d = dist(holderPos, pos)
        const progress = (pos.y - holderPos.y) * forwardSign
        const weight = Math.max(0.05, 1 / (d + 0.15) + progress * 1.5)
        candidates.push({ i, weight })
        totalWeight += weight
      }
      let r = Math.random() * totalWeight
      for (const c of candidates) {
        r -= c.weight
        if (r <= 0) return c.i
      }
      return candidates[0].i
    }

    const startNextAction = (now) => {
      const holderIdx = possessionRef.current
      const holder = FORMATION[holderIdx]
      const holderPos = positionsRef.current[holderIdx]
      const inAttackingThird = holder.team === 'A' ? holderPos.y > 0.66 : holderPos.y < 0.34
      const canShoot = inAttackingThird && holder.role !== 'GK'

      kickRef.current[holderIdx] = now

      if (canShoot && Math.random() < 0.35) {
        const toY = holder.team === 'A' ? 1 : 0
        const toX = clamp(0.5 + (Math.random() - 0.5) * 0.16, 0.4, 0.6)
        const d = dist(holderPos, { x: toX, y: toY })
        ballAnimRef.current = {
          elapsed: 0,
          duration: clamp(300 + d * 900, 300, 700) / tempoRef.current,
          fromX: holderPos.x,
          fromY: holderPos.y,
          toX,
          toY,
          kind: 'shot',
          team: holder.team,
        }
        return
      }

      let targetIdx
      if (Math.random() < 0.18) {
        const opponents = []
        for (let i = 0; i < total; i++) {
          if (FORMATION[i].team === holder.team) continue
          opponents.push(i)
        }
        opponents.sort((a, b) => dist(holderPos, positionsRef.current[a]) - dist(holderPos, positionsRef.current[b]))
        targetIdx = opponents[0]
      } else {
        targetIdx = pickPassTarget(holderIdx)
      }

      const targetPos = positionsRef.current[targetIdx]
      const d = dist(holderPos, targetPos)
      const duration = clamp(350 + d * 1300, 350, 1100) / tempoRef.current

      ballAnimRef.current = {
        elapsed: 0,
        duration,
        fromX: holderPos.x,
        fromY: holderPos.y,
        toX: targetPos.x,
        toY: targetPos.y,
        kind: 'pass',
        targetIdx,
      }
    }

    const resolveShot = (anim, now) => {
      const scored = Math.random() < 0.45
      if (scored) {
        const conceding = anim.team === 'A' ? 'B' : 'A'
        possessionRef.current = conceding === 'A' ? 1 : playersPerTeam + 1
        positionsRef.current = FORMATION.map((p) => ({ x: p.x, y: p.y }))
        ballPosRef.current = { x: 0.5, y: 0.5 }
        ballAnimRef.current = null
        nextActionAtRef.current = now + 1500 / tempoRef.current
      } else {
        possessionRef.current = anim.team === 'A' ? playersPerTeam : 0
        ballAnimRef.current = null
        nextActionAtRef.current = now + 700 / tempoRef.current
      }
    }

    let raf
    const tick = (now) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now
      const dt = now - lastTimeRef.current
      lastTimeRef.current = now

      const anim = ballAnimRef.current
      if (anim) {
        anim.elapsed += dt
        const t = clamp(anim.elapsed / anim.duration, 0, 1)
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        const bx = anim.fromX + (anim.toX - anim.fromX) * ease
        const by = anim.fromY + (anim.toY - anim.fromY) * ease
        ballPosRef.current = { x: bx, y: by }

        if (t >= 1) {
          if (anim.kind === 'shot') {
            resolveShot(anim, now)
          } else {
            possessionRef.current = anim.targetIdx
            kickRef.current[anim.targetIdx] = now
            const totalCycle = (1000 + Math.random() * 1000) / tempoRef.current
            nextActionAtRef.current = now + Math.max(80, totalCycle - anim.duration)
            ballAnimRef.current = null
          }
        }
      } else {
        ballPosRef.current = { ...positionsRef.current[possessionRef.current] }
        if (now >= nextActionAtRef.current) {
          startNextAction(now)
        }
      }

      const positions = positionsRef.current
      const jitter = jitterRef.current
      const run = runRef.current
      const holderIdx = possessionRef.current
      const ballIsLoose = !ballAnimRef.current
      const attackTeam = FORMATION[holderIdx].team
      const ball = ballPosRef.current

      for (let i = 0; i < total; i++) {
        const base = FORMATION[i]
        const j = jitter[i]
        const isDribbling = ballIsLoose && i === holderIdx

        if (isDribbling) {
          const forwardSign = base.team === 'A' ? 1 : -1
          j.vx += (Math.random() - 0.5) * 0.0025
          j.vy += (Math.random() - 0.5) * 0.0025 + forwardSign * 0.0006
          j.vx *= 0.96
          j.vy *= 0.96
          j.x = clamp(j.x + j.vx, -0.1, 0.1)
          j.y = clamp(j.y + j.vy, -0.1, 0.1)

          const targetX = clamp(base.x + j.x, 0.02, 0.98)
          const targetY = clamp(base.y + j.y, 0.01, 0.99)
          positions[i].x += (targetX - positions[i].x) * 0.06
          positions[i].y += (targetY - positions[i].y) * 0.06
          continue
        }

        j.vx += (Math.random() - 0.5) * 0.0008
        j.vy += (Math.random() - 0.5) * 0.0008
        j.vx *= 0.94
        j.vy *= 0.94
        j.x = clamp(j.x + j.vx, -0.02, 0.02)
        j.y = clamp(j.y + j.vy, -0.02, 0.02)

        const forwardSign = base.team === 'A' ? 1 : -1
        const isAttacking = base.team === attackTeam
        const teamFactor = isAttacking ? 1 : -0.6
        const wobble = 0.5 + 0.5 * Math.sin(now * 0.0006 * run[i].freq + run[i].phase)
        const dynY = base.y + forwardSign * teamFactor * ROLE_ADVANCE[base.role] * wobble

        const lateralPull = ROLE_LATERAL[base.role] * (isAttacking ? 1 : 0.4)
        const dynX = base.x + (ball.x - base.x) * lateralPull

        const targetX = clamp(dynX + j.x, 0.02, 0.98)
        const targetY = clamp(dynY + j.y, 0.01, 0.99)

        positions[i].x += (targetX - positions[i].x) * 0.045
        positions[i].y += (targetY - positions[i].y) * 0.045
      }

      if (ballIsLoose) {
        ballPosRef.current = { ...positions[holderIdx] }
      }

      const rect = stage.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const playerHalfW = w * (posterSizeRef.current / 100) / 2
      const playerHalfH = playerHalfW * 1.25
      const ballR = w * (ballSizeRef.current / 100) / 2

      for (let i = 0; i < total; i++) {
        const el = playerRefs.current[i]
        if (el) {
          const r = rotRef.current[i]
          const angle = Math.sin(now * 0.0005 * r.freq + r.phase) * r.amp
          const kickElapsed = now - kickRef.current[i]
          let scale = 1
          if (kickElapsed >= 0 && kickElapsed < BOUNCE_DURATION) {
            const p = kickElapsed / BOUNCE_DURATION
            scale = 1 + Math.sin(p * Math.PI) * 0.18
          }
          el.style.transform = `translate(${positions[i].x * w - playerHalfW}px, ${positions[i].y * h - playerHalfH}px) rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`
        }
      }
      const ballEl = ballRef.current
      if (ballEl) {
        ballEl.style.transform = `translate(${ballPosRef.current.x * w - ballR}px, ${ballPosRef.current.y * h - ballR}px)`
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [active, stageRef, playerRefs, ballRef, playersPerTeam])
}
