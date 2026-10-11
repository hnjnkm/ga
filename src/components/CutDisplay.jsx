import { useState, useCallback } from 'react'
import styles from './CutDisplay.module.css'
import useCut from '../hooks/useCut.js'

export default function CutDisplay({ active, images, speed, autoMode, indexRef }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleIndexChange = useCallback((i) => {
    setCurrentIndex(i)
    if (indexRef) indexRef.current = i
  }, [indexRef])

  useCut({ images, active, speed, autoMode, onIndexChange: handleIndexChange })

  const img = images[currentIndex]

  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        {img ? (
          <img src={img.url} alt="" draggable={false} />
        ) : (
          <div className={styles.placeholder}>이미지를 업로드하세요</div>
        )}
      </div>
    </div>
  )
}
