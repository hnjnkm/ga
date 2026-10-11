import { useEffect, useRef, useState } from 'react'
import styles from './Canvas.module.css'
import useTrail from '../hooks/useTrail.js'
import useBurst from '../hooks/useBurst.js'
import useOrbit from '../hooks/useOrbit.js'
import useRepel from '../hooks/useRepel.js'
import useGravity from '../hooks/useGravity.js'
import useRecorder from '../hooks/useRecorder.js'
import SoccerField from './SoccerField.jsx'
import CutDisplay from './CutDisplay.jsx'

const PLACEHOLDER_COLORS = [
  '#3a3a3a',
  '#4a4a4a',
  '#2e2e2e',
  '#555555',
  '#383838',
]

export default function Canvas({
  mode,
  ratioValue,
  imageSize,
  count,
  images,
  trailSpeed,
  burstSpeed,
  orbitSpeed,
  orbitRadius,
  setOrbitRadius,
  repelSpeed,
  gravitySpeed,
  soccerPosterSize,
  soccerBallSize,
  soccerPassTempo,
  soccerPlayersPerTeam,
  cutSpeed,
  cutAutoMode,
}) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const posterRefs = useRef([])
  const sizeRef = useRef({ width: imageSize, height: imageSize })
  const stageSizeRef = useRef({ width: 0, height: 0 })
  const transformsRef = useRef([])
  const cutIndexRef = useRef(0)
  const imageIndicesRef = useRef([])
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  // Update sizeRef using actual image aspect ratio when images change
  useEffect(() => {
    if (images.length === 0) {
      sizeRef.current = { width: imageSize, height: imageSize }
      return
    }
    const img = new Image()
    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth
      sizeRef.current = { width: imageSize, height: imageSize * ratio }
    }
    img.src = images[0].url
  }, [images, imageSize])

  useEffect(() => {
    if (images.length > 0) return // handled above with ratio
    sizeRef.current = { width: imageSize, height: imageSize }
  }, [imageSize, images.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const padding = 80
      const cw = container.clientWidth - padding
      const ch = container.clientHeight - padding
      let w = cw
      let h = w / ratioValue
      if (h > ch) {
        h = ch
        w = h * ratioValue
      }
      const size = { width: Math.max(w, 0), height: Math.max(h, 0) }
      setStageSize(size)
      stageSizeRef.current = size
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [ratioValue])

  const { cycleOffset } = useTrail({
    stageRef,
    posterRefs,
    count,
    imagesLength: images.length,
    sizeRef,
    active: mode === 'trail',
    speed: trailSpeed,
    transformsRef,
  })

  useBurst({
    stageRef,
    posterRefs,
    count,
    sizeRef,
    active: mode === 'burst',
    speed: burstSpeed,
    transformsRef,
  })

  useOrbit({
    stageRef,
    posterRefs,
    count,
    sizeRef,
    active: mode === 'orbit',
    speed: orbitSpeed,
    radiusScale: orbitRadius,
    onRadiusChange: setOrbitRadius,
    transformsRef,
  })

  useRepel({
    stageRef,
    posterRefs,
    count,
    sizeRef,
    active: mode === 'repel',
    speed: repelSpeed,
    transformsRef,
  })

  useGravity({
    stageRef,
    posterRefs,
    count,
    sizeRef,
    active: mode === 'gravity',
    speed: gravitySpeed,
    transformsRef,
  })

  const { isRecording } = useRecorder({
    stageSizeRef,
    sizeRef,
    transformsRef,
    imageIndicesRef,
    images,
    count,
    placeholderColors: PLACEHOLDER_COLORS,
    mode,
    cutIndexRef,
  })

  posterRefs.current.length = count
  transformsRef.current.length = count
  imageIndicesRef.current.length = count

  return (
    <div className={styles.canvasArea} ref={containerRef}>
      {isRecording && (
        <div className={styles.recIndicator}>
          <span className={styles.recDot} />
          REC
        </div>
      )}
      <div
        className={styles.stage}
        ref={stageRef}
        style={{ width: stageSize.width, height: stageSize.height }}
      >
        {mode === 'cut' && (
          <CutDisplay
            active={mode === 'cut'}
            images={images}
            speed={cutSpeed}
            autoMode={cutAutoMode}
            indexRef={cutIndexRef}
          />
        )}
        {mode === 'soccer' && (
          <SoccerField
            stageRef={stageRef}
            active={mode === 'soccer'}
            images={images}
            posterSize={soccerPosterSize}
            ballSize={soccerBallSize}
            passTempo={soccerPassTempo}
            playersPerTeam={soccerPlayersPerTeam}
          />
        )}
        {mode !== 'soccer' && Array.from({ length: count }).map((_, i) => {
          const imgIdx = images.length > 0 ? (cycleOffset + i) % images.length : null
          imageIndicesRef.current[i] = imgIdx
          return (
            <div
              key={i}
              ref={(el) => (posterRefs.current[i] = el)}
              className={styles.poster}
              style={{ width: imageSize }}
            >
              {imgIdx !== null ? (
                <img src={images[imgIdx].url} alt="" draggable={false} />
              ) : (
                <div
                  className={styles.placeholder}
                  style={{ background: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length] }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
