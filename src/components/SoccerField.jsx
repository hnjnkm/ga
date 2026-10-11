import { useRef } from 'react'
import styles from './SoccerField.module.css'
import useSoccer from '../hooks/useSoccer.js'

const TEAM_COLORS = ['#e0483e', '#3e7fe0']

export default function SoccerField({ stageRef, active, images, posterSize = 6, ballSize = 1.5, passTempo = 1, playersPerTeam = 11 }) {
  const playerRefs = useRef([])
  const ballRef = useRef(null)

  useSoccer({
    stageRef,
    playerRefs,
    ballRef,
    active,
    posterSize,
    ballSize,
    passTempo,
    playersPerTeam,
  })

  return (
    <div className={styles.pitch}>
      {Array.from({ length: playersPerTeam * 2 }).map((_, i) => {
        const team = i < playersPerTeam ? 0 : 1
        const img = images[team]
        return (
          <div
            key={i}
            ref={(el) => (playerRefs.current[i] = el)}
            className={styles.player}
            style={{ width: `${posterSize}%` }}
          >
            {img ? (
              <img src={img.url} alt="" draggable={false} />
            ) : (
              <div className={styles.placeholder} style={{ background: TEAM_COLORS[team] }} />
            )}
          </div>
        )
      })}
      <div ref={ballRef} className={styles.ball} style={{ width: `${ballSize}%` }} />
    </div>
  )
}
