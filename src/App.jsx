import { useState } from 'react'
import styles from './App.module.css'
import ControlPanel from './components/ControlPanel.jsx'
import Canvas from './components/Canvas.jsx'

const RATIOS = {
  '9:16': 9 / 16,
  '1:1': 1,
  '16:9': 16 / 9,
  '4:5': 4 / 5,
}

export default function App() {
  const [mode, setMode] = useState('trail')
  const [ratio, setRatio] = useState('9:16')
  const [trailImageSize, setTrailImageSize] = useState(150)
  const [burstImageSize, setBurstImageSize] = useState(100)
  const [orbitImageSize, setOrbitImageSize] = useState(150)
  const [repelImageSize, setRepelImageSize] = useState(150)
  const [gravityImageSize, setGravityImageSize] = useState(150)
  const [count, setCount] = useState(10)
  const [images, setImages] = useState([])
  const [trailSpeed, setTrailSpeed] = useState(0.4)
  const [burstSpeed, setBurstSpeed] = useState(1)
  const [orbitSpeed, setOrbitSpeed] = useState(0.5)
  const [orbitRadius, setOrbitRadius] = useState(1)
  const [repelSpeed, setRepelSpeed] = useState(0.5)
  const [gravitySpeed, setGravitySpeed] = useState(0.5)
  const [soccerPosterSize, setSoccerPosterSize] = useState(6)
  const [soccerBallSize, setSoccerBallSize] = useState(1.5)
  const [soccerPassTempo, setSoccerPassTempo] = useState(1)
  const [soccerPlayersPerTeam, setSoccerPlayersPerTeam] = useState(11)
  const [cutBatchSize, setCutBatchSize] = useState(10)
  const [cutBatchRequest, setCutBatchRequest] = useState(0)
  const [cutBatchRepeats, setCutBatchRepeats] = useState(3)
  const [cutRepeats, setCutRepeats] = useState(1)
  const [cutExportRequest, setCutExportRequest] = useState(0)
  const [recordingStatus, setRecordingStatus] = useState({ busy: false, error: '' })
  const [stopRequest, setStopRequest] = useState(0)
  const [cutSpeed, setCutSpeed] = useState(2)
  const [cutAutoMode, setCutAutoMode] = useState(true)

  const imageSizeMap = {
    trail: [trailImageSize, setTrailImageSize],
    burst: [burstImageSize, setBurstImageSize],
    orbit: [orbitImageSize, setOrbitImageSize],
    repel: [repelImageSize, setRepelImageSize],
    gravity: [gravityImageSize, setGravityImageSize],
  }
  const [imageSize, setImageSize] = imageSizeMap[mode] || imageSizeMap.trail

  return (
    <div className={styles.app}>
      <ControlPanel
        cutBatchSize={cutBatchSize}
        setCutBatchSize={setCutBatchSize}
        cutBatchRepeats={cutBatchRepeats}
        setCutBatchRepeats={setCutBatchRepeats}
        onCutBatch={() => setCutBatchRequest((n) => n + 1)}
        cutRepeats={cutRepeats}
        setCutRepeats={setCutRepeats}
        onCutExport={() => setCutExportRequest((n) => n + 1)}
        onStopRecording={() => setStopRequest((n) => n + 1)}
        recordingStatus={recordingStatus}
        mode={mode}
        setMode={setMode}
        ratio={ratio}
        setRatio={setRatio}
        imageSize={imageSize}
        setImageSize={setImageSize}
        count={count}
        setCount={setCount}
        images={images}
        setImages={setImages}
        trailSpeed={trailSpeed}
        setTrailSpeed={setTrailSpeed}
        burstSpeed={burstSpeed}
        setBurstSpeed={setBurstSpeed}
        orbitSpeed={orbitSpeed}
        setOrbitSpeed={setOrbitSpeed}
        orbitRadius={orbitRadius}
        setOrbitRadius={setOrbitRadius}
        repelSpeed={repelSpeed}
        setRepelSpeed={setRepelSpeed}
        gravitySpeed={gravitySpeed}
        setGravitySpeed={setGravitySpeed}
        soccerPosterSize={soccerPosterSize}
        setSoccerPosterSize={setSoccerPosterSize}
        soccerBallSize={soccerBallSize}
        setSoccerBallSize={setSoccerBallSize}
        soccerPassTempo={soccerPassTempo}
        setSoccerPassTempo={setSoccerPassTempo}
        soccerPlayersPerTeam={soccerPlayersPerTeam}
        setSoccerPlayersPerTeam={setSoccerPlayersPerTeam}
        cutSpeed={cutSpeed}
        setCutSpeed={setCutSpeed}
        cutAutoMode={cutAutoMode}
        setCutAutoMode={setCutAutoMode}
      />
      <Canvas
        cutBatchSize={cutBatchSize}
        cutBatchRepeats={cutBatchRepeats}
        cutBatchRequest={cutBatchRequest}
        cutRepeats={cutRepeats}
        cutExportRequest={cutExportRequest}
        stopRequest={stopRequest}
        onRecordingStatus={setRecordingStatus}
        mode={mode}
        outputRatio={ratio}
        ratioValue={RATIOS[ratio]}
        imageSize={imageSize}
        count={count}
        images={images}
        trailSpeed={trailSpeed}
        burstSpeed={burstSpeed}
        orbitSpeed={orbitSpeed}
        orbitRadius={orbitRadius}
        setOrbitRadius={setOrbitRadius}
        repelSpeed={repelSpeed}
        gravitySpeed={gravitySpeed}
        soccerPosterSize={soccerPosterSize}
        soccerBallSize={soccerBallSize}
        soccerPassTempo={soccerPassTempo}
        soccerPlayersPerTeam={soccerPlayersPerTeam}
        cutSpeed={cutSpeed}
        cutAutoMode={cutAutoMode}
      />
    </div>
  )
}
