import { useRef, useState } from 'react'
import styles from './ControlPanel.module.css'

const RATIOS = ['9:16', '1:1', '16:9', '4:5']

export default function ControlPanel({
  cutDownloadMode, setCutDownloadMode,
  cutBatchSize, setCutBatchSize, cutBatchRepeats, setCutBatchRepeats, onCutBatch,
  cutRepeats, setCutRepeats, onCutExport, onStopRecording, recordingStatus,
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
  const generatingMode = mode === 'cut-generate'
  const isCut = mode === 'cut' || generatingMode
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [visibleThumbs, setVisibleThumbs] = useState(40)

  const addFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    const newImages = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    if (mode === 'soccer') {
      setImages((prev) => [...prev, ...newImages].slice(0, 2))

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
      <fieldset className={styles.controls} disabled={recordingStatus.busy}>
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
            컷 녹화
          </button>
          <button className={`${styles.toggleBtn} ${generatingMode ? styles.active : ''}`} onClick={() => setMode('cut-generate')}>
            컷 생성
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

      {mode !== 'soccer' && !isCut && (
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

      {mode !== 'soccer' && !isCut && (
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

      {isCut && (
      <section className={styles.section}>
        {!generatingMode && <>
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
        </>}
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
      </section>
      )}

      {isCut && (
        <section className={styles.section}>
          <label className={styles.labelRow} htmlFor="cut-repeats">
            <span className={styles.label}>{generatingMode ? '생성 반복 횟수' : '녹화 반복 횟수'}</span>
            <input id="cut-repeats" className={styles.repeatInput} type="number" min="1" max="100" step="1"
              value={cutRepeats} onChange={(e) => setCutRepeats(Math.max(1, Math.min(100, Math.trunc(Number(e.target.value)) || 1)))} />
          </label>
          <div className={styles.value}>
            {images.length}장 × {cutRepeats}회 · 약 {(images.length * cutRepeats / cutSpeed).toFixed(1)}초
          </div>
          <button className={`${styles.toggleBtn} ${styles.active}`} disabled={!images.length} onClick={onCutExport}>
            {generatingMode ? 'MP4 생성·다운로드' : '자동 녹화·다운로드'}
          </button>
          <div className={styles.value}>{generatingMode ? '파일명 숫자 순서로 영상을 직접 생성합니다. 다른 탭에서도 생성 작업은 이어집니다.' : '첫 이미지부터 재생 후 자동 저장됩니다.'}</div>
        </section>
      )}

      {isCut && (
        <section className={styles.section}>
          <div className={styles.label}>{generatingMode ? '일괄 MP4 생성' : '일괄 영상 녹화'}</div>
          <label className={styles.labelRow} htmlFor="cut-batch-size">
            <span className={styles.value}>영상당 이미지 수</span>
            <input id="cut-batch-size" className={styles.repeatInput} type="number" min="1" max="1000" value={cutBatchSize}
              onChange={(e) => setCutBatchSize(Math.max(1, Math.min(1000, Math.trunc(Number(e.target.value)) || 1)))} />
          </label>
          <label className={styles.labelRow} htmlFor="cut-batch-repeats">
            <span className={styles.value}>각 영상 반복 횟수</span>
            <input id="cut-batch-repeats" className={styles.repeatInput} type="number" min="1" max="100" value={cutBatchRepeats}
              onChange={(e) => setCutBatchRepeats(Math.max(1, Math.min(100, Math.trunc(Number(e.target.value)) || 1)))} />
          </label>
          <div className={styles.value}>
            {images.length}장 → 영상 {Math.ceil(images.length / cutBatchSize)}개 · {generatingMode ? '총 영상 길이' : '약'} {(images.length * cutBatchRepeats / cutSpeed / 60).toFixed(1)}분
          </div>
          <div className={styles.label}>다운로드 방식</div>
          <div className={styles.toggleRow}>
            <button aria-pressed={cutDownloadMode === 'individual'} className={`${styles.toggleBtn} ${cutDownloadMode === 'individual' ? styles.active : ''}`} onClick={() => setCutDownloadMode('individual')}>
              개별 다운로드
            </button>
            <button aria-pressed={cutDownloadMode === 'zip'} className={`${styles.toggleBtn} ${cutDownloadMode === 'zip' ? styles.active : ''}`} onClick={() => setCutDownloadMode('zip')}>
              ZIP으로 받기
            </button>
          </div>
          <button className={`${styles.toggleBtn} ${styles.active}`} disabled={!images.length} onClick={onCutBatch}>
            {generatingMode ? (cutDownloadMode === 'zip' ? '일괄 생성·ZIP 다운로드' : '일괄 생성·개별 다운로드') : (cutDownloadMode === 'zip' ? '일괄 녹화·ZIP 다운로드' : '일괄 녹화·개별 다운로드')}
          </button>
          <div className={styles.help}>
            파일명 숫자 순서로 묶습니다. 마지막 묶음은 남은 이미지로 만듭니다.
            {cutDownloadMode === 'zip' ? ' 모든 영상이 완성되면 ZIP 하나로 저장합니다.' : ' 영상마다 완성 즉시 다운로드합니다. Chrome에서 여러 파일 자동 다운로드를 허용해 주세요.'}
          </div>
        </section>
      )}

      {mode !== 'soccer' && !isCut && (
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
            {images.slice(0, visibleThumbs).map((img) => (
              <div key={img.id} className={styles.thumb}>
                <img src={img.url} alt={img.name || ''} loading="lazy" />
                <button className={styles.thumbRemove} onClick={() => removeImage(img.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {images.length > visibleThumbs && (
        <button className={styles.toggleBtn} onClick={() => setVisibleThumbs((n) => n + 40)}>이미지 더 보기 ({visibleThumbs}/{images.length})</button>
      )}
      </fieldset>
      <div role="status" className={styles.value}>
        {recordingStatus.busy && (recordingStatus.generating ? `영상 생성 중… ${Math.round((recordingStatus.progress || 0) * 100)}%` : recordingStatus.paused ? '일시정지 · 이 탭으로 돌아오면 계속됩니다.' : recordingStatus.preparing ? '이미지 준비 중…' : '녹화 중…')}
        {recordingStatus.batch && <div>영상 {recordingStatus.completed}/{recordingStatus.total}개 완료 · {recordingStatus.range}</div>}
        {recordingStatus.message}
        {recordingStatus.error}
      </div>
      {recordingStatus.busy && (
        <button className={styles.toggleBtn} onClick={onStopRecording}>
          {recordingStatus.generating ? (cutDownloadMode === 'zip' && recordingStatus.batch ? '생성 중단·완료 영상 저장' : '생성 중단') : recordingStatus.batch ? (cutDownloadMode === 'zip' ? '일괄 중단·완료 영상 저장' : '일괄 녹화 중단') : recordingStatus.preparing ? '취소' : '녹화 종료·저장'}
        </button>
      )}
      <div className={styles.footer}>
        {mode === 'burst' && <>SPACE &nbsp;→&nbsp; 버스트 / 모으기<br /></>}
        {mode === 'cut' && !cutAutoMode && <>SPACE &nbsp;→&nbsp; 다음 컷<br /></>}
        {generatingMode ? '창 크기와 무관한 고정 해상도 MP4 생성' : <>R &nbsp;→&nbsp; 녹화 시작 / 종료</>}
      </div>
    </div>
  )
}
