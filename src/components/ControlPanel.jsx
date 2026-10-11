import { useRef, useState } from 'react'
import styles from './ControlPanel.module.css'

const RATIOS = ['9:16', '1:1', '16:9', '4:5']

export default function ControlPanel({
  mode,
  setMode,
  ratio,
  setRatio,
  imageSize,
  setImageSize,
  count,
  setCount,
  images,
  setImages,
  trailSpeed,
  setTrailSpeed,
  burstSpeed,
  setBurstSpeed,
  orbitSpeed,
  setOrbitSpeed,
  orbitRadius,
  setOrbitRadius,
  repelSpeed,
  setRepelSpeed,
  gravitySpeed,
  setGravitySpeed,
  soccerPosterSize,
  setSoccerPosterSize,
  soccerBallSize,
  setSoccerBallSize,
  soccerPassTempo,
  setSoccerPassTempo,
  soccerPlayersPerTeam,
  setSoccerPlayersPerTeam,
  cutSpeed,
  setCutSpeed,
  cutAutoMode,
  setCutAutoMode,
}) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    const newImages = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
    }))
    if (mode === 'soccer') {
      setImages((prev) => [...prev, ...newImages].slice(0, 2))
    } else if (mode === 'cut') {
      setImages((prev) => [...prev, ...newImages].slice(0, 20))
    } else {
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <div className={styles.label}>모드</div>
        <div className={styles.toggleRow}>
          <button
            className={`${styles.toggleBtn} ${mode === 'trail' ? styles.active : ''}`}
            onClick={() => setMode('trail')}
          >
            트레일
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'burst' ? styles.active : ''}`}
            onClick={() => setMode('burst')}
          >
            버스트
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'orbit' ? styles.active : ''}`}
            onClick={() => setMode('orbit')}
          >
            공전
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'repel' ? styles.active : ''}`}
            onClick={() => setMode('repel')}
          >
            반발
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'gravity' ? styles.active : ''}`}
            onClick={() => setMode('gravity')}
          >
            중력
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'soccer' ? styles.active : ''}`}
            onClick={() => setMode('soccer')}
          >
            축구
          </button>
          <button
            className={`${styles.toggleBtn} ${mode === 'cut' ? styles.active : ''}`}
            onClick={() => setMode('cut')}
          >
            컷
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.label}>캔버스 비율</div>
        <div className={styles.toggleRow}>
          {RATIOS.map((r) => (
            <button
              key={r}
              className={`${styles.toggleBtn} ${ratio === r ? styles.active : ''}`}
              onClick={() => setRatio(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {mode !== 'soccer' && mode !== 'cut' && (
      <section className={styles.section}>
        <div className={styles.labelRow}>
          <span className={styles.label}>이미지 크기</span>
          <span className={styles.value}>{imageSize}px</span>
        </div>
        <input
          type="range"
          min={50}
          max={400}
          value={imageSize}
          onChange={(e) => setImageSize(Number(e.target.value))}
          className={styles.slider}
        />
      </section>
      )}

      {mode !== 'soccer' && mode !== 'cut' && (
      <section className={styles.section}>
        <div className={styles.labelRow}>
          <span className={styles.label}>이미지 개수</span>
          <span className={styles.value}>{count}</span>
        </div>
        <input
          type="range"
          min={1}
          max={mode === 'repel' ? 40 : 20}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className={styles.slider}
        />
      </section>
      )}

      {mode === 'soccer' && (
      <section className={styles.section}>
        <div className={styles.labelRow}>
          <span className={styles.label}>팀당 인원</span>
          <span className={styles.value}>{soccerPlayersPerTeam}명</span>
        </div>
        <input
          type="range"
          min={5}
          max={11}
          step={1}
          value={soccerPlayersPerTeam}
          onChange={(e) => setSoccerPlayersPerTeam(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.labelRow}>
          <span className={styles.label}>포스터 크기</span>
          <span className={styles.value}>{soccerPosterSize.toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min={2}
          max={14}
          step={0.5}
          value={soccerPosterSize}
          onChange={(e) => setSoccerPosterSize(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.labelRow}>
          <span className={styles.label}>공 크기</span>
          <span className={styles.value}>{soccerBallSize.toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.1}
          value={soccerBallSize}
          onChange={(e) => setSoccerBallSize(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.labelRow}>
          <span className={styles.label}>패스 속도</span>
          <span className={styles.value}>{soccerPassTempo.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.1}
          value={soccerPassTempo}
          onChange={(e) => setSoccerPassTempo(Number(e.target.value))}
          className={styles.slider}
        />
      </section>
      )}

      {mode === 'cut' && (
      <section className={styles.section}>
        <div className={styles.label}>전환 모드</div>
        <div className={styles.toggleRow}>
          <button
            className={`${styles.toggleBtn} ${cutAutoMode ? styles.active : ''}`}
            onClick={() => setCutAutoMode(true)}
          >
            자동
          </button>
          <button
            className={`${styles.toggleBtn} ${!cutAutoMode ? styles.active : ''}`}
            onClick={() => setCutAutoMode(false)}
          >
            수동 (스페이스)
          </button>
        </div>
        {cutAutoMode && (
          <>
            <div className={styles.labelRow}>
              <span className={styles.label}>전환 속도</span>
              <span className={styles.value}>{cutSpeed}장/초</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={cutSpeed}
              onChange={(e) => setCutSpeed(Number(e.target.value))}
              className={styles.slider}
            />
          </>
        )}
      </section>
      )}

      {mode !== 'soccer' && mode !== 'cut' && (
      <section className={styles.section}>
        {mode === 'trail' && (
          <>
            <div className={styles.labelRow}>
              <span className={styles.label}>트레일 속도</span>
              <span className={styles.value}>{trailSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={trailSpeed}
              onChange={(e) => setTrailSpeed(Number(e.target.value))}
              className={styles.slider}
            />
          </>
        )}
        {mode === 'burst' && (
          <>
            <div className={styles.labelRow}>
              <span className={styles.label}>버스트 속도</span>
              <span className={styles.value}>{burstSpeed.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={2}
              step={0.1}
              value={burstSpeed}
              onChange={(e) => setBurstSpeed(Number(e.target.value))}
              className={styles.slider}
            />
          </>
        )}
        {mode === 'orbit' && (
          <>
            <div className={styles.labelRow}>
              <span className={styles.label}>공전 속도</span>
              <span className={styles.value}>{orbitSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={6}
              step={0.05}
              value={orbitSpeed}
              onChange={(e) => setOrbitSpeed(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.labelRow}>
              <span className={styles.label}>공전 지름</span>
              <span className={styles.value}>{orbitRadius.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={orbitRadius}
              onChange={(e) => setOrbitRadius(Number(e.target.value))}
              className={styles.slider}
            />
          </>
        )}
        {mode === 'repel' && (
          <>
            <div className={styles.labelRow}>
              <span className={styles.label}>반발 속도</span>
              <span className={styles.value}>{repelSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={repelSpeed}
              onChange={(e) => setRepelSpeed(Number(e.target.value))}
              className={styles.slider}
            />
          </>
        )}
        {mode === 'gravity' && (
          <>
            <div className={styles.labelRow}>
              <span className={styles.label}>중력 속도</span>
              <span className={styles.value}>{gravitySpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.05}
              value={gravitySpeed}
              onChange={(e) => setGravitySpeed(Number(e.target.value))}
              className={styles.slider}
            />
          </>
        )}
      </section>
      )}

      <section className={styles.section}>
        <div className={styles.label}>이미지 업로드</div>
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          드래그 또는 클릭하여 업로드
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className={styles.fileInput}
          />
        </div>
        {images.length > 0 && (
          <div className={styles.thumbList}>
            {images.map((img) => (
              <div key={img.id} className={styles.thumb}>
                <img src={img.url} alt="" />
                <button className={styles.thumbRemove} onClick={() => removeImage(img.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className={styles.footer}>
        {mode === 'burst' && <>SPACE &nbsp;→&nbsp; 버스트 / 모으기<br /></>}
        {mode === 'cut' && !cutAutoMode && <>SPACE &nbsp;→&nbsp; 다음 컷<br /></>}
        R &nbsp;→&nbsp; 녹화 시작 / 종료
      </div>
    </div>
  )
}
