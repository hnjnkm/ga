import { useCallback, useEffect, useRef, useState } from 'react'

const MIME_CANDIDATES = [
  'video/mp4;codecs=h264',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm',
]

const MAX_DIMENSION = 1920
const MAX_SCALE = 4

export default function useRecorder({
  cutRepeats, cutExportRequest, stopRequest, cutSpeed, onRecordingStatus,
  stageSizeRef,
  sizeRef,
  transformsRef,
  imageIndicesRef,
  images,
  count,
  placeholderColors,
  mode,
  cutIndexRef,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [cutRecordingIndex, setCutRecordingIndex] = useState(null)
  const busyRef = useRef(false)
  const prepareTokenRef = useRef(0)
  const exportRequestRef = useRef(cutExportRequest)
  const stopRequestRef = useRef(stopRequest)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const canvasStreamRef = useRef(null)
  const rafRef = useRef(null)
  const mimeRef = useRef('video/webm')
  const imageElementsRef = useRef(new Map())

  useEffect(() => {
    images.forEach((img) => {
      if (!imageElementsRef.current.has(img.url)) {
        const el = new Image()
        el.src = img.url
        imageElementsRef.current.set(img.url, el)
      }
    })
  }, [images])

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    busyRef.current = false
    setIsPreparing(false)
    setCutRecordingIndex(null)
    onRecordingStatus({ busy: false, error: '' })
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop())
    canvasStreamRef.current = null
  }, [onRecordingStatus])

  const stopRecording = useCallback(() => {
    prepareTokenRef.current += 1
    if (busyRef.current && !recorderRef.current) cleanup()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [cleanup])

  const startRecording = useCallback(async (automaticCut = false) => {
    if (busyRef.current) return
    if (automaticCut && (mode !== 'cut' || !images.length)) return
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      onRecordingStatus({ busy: false, error: '이 브라우저에서는 영상 녹화를 지원하지 않습니다.' })
      return
    }
    const { width: stageW, height: stageH } = stageSizeRef.current
    if (!stageW || !stageH) return
    busyRef.current = true
    recorderRef.current = null
    const token = ++prepareTokenRef.current
    setIsPreparing(true)
    onRecordingStatus({ busy: true, preparing: true, error: '' })
    try {
      await Promise.all(images.map(async (img) => {
        let el = imageElementsRef.current.get(img.url)
        if (!el) {
          el = new Image()
          el.src = img.url
          imageElementsRef.current.set(img.url, el)
        }
        await el.decode()
      }))
    } catch {
      if (token !== prepareTokenRef.current) return
      cleanup()
      onRecordingStatus({ busy: false, error: '이미지를 읽지 못했습니다. 파일을 확인해 주세요.' })
      return
    }
    if (token !== prepareTokenRef.current) return
    setIsPreparing(false)
    const totalFrames = images.length * cutRepeats
    let startedAt = null
    let previousIndex = -1

    const scale = Math.min(MAX_SCALE, MAX_DIMENSION / Math.max(stageW, stageH))
    const outW = Math.round(stageW * scale)
    const outH = Math.round(stageH * scale)

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    const draw = (now) => {
      if (startedAt === null) startedAt = now
      let automaticIndex = null
      if (automaticCut) {
        const frame = Math.floor((now - startedAt) * cutSpeed / 1000)
        if (frame >= totalFrames) {
          stopRecording()
          return
        }
        automaticIndex = frame % images.length
        if (previousIndex !== automaticIndex) {
          previousIndex = automaticIndex
          setCutRecordingIndex(automaticIndex)
        }
      }
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, outW, outH)

      if (mode === 'cut') {
        const idx = automaticIndex ?? (cutIndexRef ? cutIndexRef.current : 0)
        const imgData = images[idx]
        const imgEl = imgData ? imageElementsRef.current.get(imgData.url) : null
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          const size = Math.min(outW, outH) * (1000 / 1080)
          const x = (outW - size) / 2
          const y = (outH - size) / 2
          const side = Math.min(imgEl.naturalWidth, imgEl.naturalHeight)
          ctx.drawImage(imgEl, (imgEl.naturalWidth - side) / 2, (imgEl.naturalHeight - side) / 2, side, side, x, y, size, size)
        }
      } else {
        const { width: pw, height: ph } = sizeRef.current

        for (let i = 0; i < count; i++) {
          const t = transformsRef.current[i]
          if (!t) continue

          const w = pw * scale
          const h = ph * scale

          ctx.save()
          ctx.translate(t.x * scale, t.y * scale)
          ctx.rotate((t.rotation * Math.PI) / 180)

          const imgIdx = imageIndicesRef.current[i]
          const imgData = imgIdx != null ? images[imgIdx] : null
          const imgEl = imgData ? imageElementsRef.current.get(imgData.url) : null

          if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
            ctx.drawImage(imgEl, -w / 2, -h / 2, w, h)
          } else {
            ctx.fillStyle = placeholderColors[i % placeholderColors.length]
            ctx.fillRect(-w / 2, -h / 2, w, h)
          }

          ctx.lineWidth = Math.max(1, 0.2 * scale)
          ctx.strokeStyle = '#ffffff'
          ctx.strokeRect(-w / 2, -h / 2, w, h)

          ctx.restore()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    const canvasStream = canvas.captureStream(60)
    canvasStreamRef.current = canvasStream

    const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm'
    mimeRef.current = mime
    chunksRef.current = []

    let recorder
    try {
      recorder = new MediaRecorder(canvasStream, { mimeType: mime })
    } catch {
      try {
        recorder = new MediaRecorder(canvasStream)
      } catch (err) {
        console.error('MediaRecorder failed:', err)
        cleanup()
        onRecordingStatus({ busy: false, error: '영상 녹화를 시작하지 못했습니다. 다른 브라우저에서 다시 시도해 주세요.' })
        return
      }
    }
    mimeRef.current = recorder.mimeType || mime

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current })
      const url = URL.createObjectURL(blob)
      const ext = mimeRef.current.startsWith('video/mp4') ? 'mp4' : 'webm'
      const a = document.createElement('a')
      a.href = url
      a.download = `poster_trail.${ext}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      recorderRef.current = null
      cleanup()
      setIsRecording(false)
    }

    recorder.onerror = () => {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      recorderRef.current = null
      cleanup()
      setIsRecording(false)
      onRecordingStatus({ busy: false, error: '녹화 중 오류가 발생했습니다. 다시 시도해 주세요.' })
    }
    try {
      recorder.start()
    } catch {
      recorder.onstop = null
      cleanup()
      onRecordingStatus({ busy: false, error: '영상 녹화를 시작하지 못했습니다.' })
      return
    }
    recorderRef.current = recorder
    if (automaticCut) setCutRecordingIndex(0)
    onRecordingStatus({ busy: true, preparing: false, error: '' })
    setIsRecording(true)
  }, [cutRepeats, cutSpeed, onRecordingStatus, stopRecording, stageSizeRef, sizeRef, transformsRef, imageIndicesRef, images, count, placeholderColors, mode, cutIndexRef, cleanup])

  useEffect(() => {
    if (cutExportRequest === exportRequestRef.current) return
    exportRequestRef.current = cutExportRequest
    startRecording(true)
  }, [cutExportRequest, startRecording])

  useEffect(() => {
    if (stopRequest === stopRequestRef.current) return
    stopRequestRef.current = stopRequest
    stopRecording()
  }, [stopRequest, stopRecording])

  useEffect(() => () => {
    prepareTokenRef.current += 1
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const recorder = recorderRef.current
    if (recorder) {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
    }
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() !== 'r' || e.repeat) return
      const target = e.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (busyRef.current) stopRecording()
      else startRecording()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, startRecording, stopRecording])

  return { isRecording, isPreparing, cutRecordingIndex }
}
