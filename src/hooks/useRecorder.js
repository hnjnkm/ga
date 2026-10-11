import { useCallback, useEffect, useRef, useState } from 'react'
import { Zip, ZipPassThrough } from 'fflate'
import { createCutBatches } from '../utils/cutBatch.js'
import { getRecordingSize } from '../utils/recordingSize.js'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

const MIME_CANDIDATES = [
  'video/mp4;codecs=h264',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm',
]

export default function useRecorder({
  cutDownloadMode, cutBatchSize, cutBatchRepeats, cutBatchRequest,
  cutRepeats, cutExportRequest, stopRequest, cutSpeed, onRecordingStatus,
  outputRatio,
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
  const batchRef = useRef(null)
  const batchRequestRef = useRef(cutBatchRequest)
  const prepareTokenRef = useRef(0)
  const exportRequestRef = useRef(cutExportRequest)
  const stopRequestRef = useRef(stopRequest)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const canvasStreamRef = useRef(null)
  const rafRef = useRef(null)
  const visibilityCleanupRef = useRef(null)
  const mimeRef = useRef('video/webm')
  const imageElementsRef = useRef(new Map())

  const reportStatus = useCallback((status) => {
    const batch = batchRef.current
    onRecordingStatus(batch ? { ...status, busy: true, batch: true,
      completed: batch.completed, total: batch.total, range: batch.range } : status)
  }, [onRecordingStatus])

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    visibilityCleanupRef.current?.()
    visibilityCleanupRef.current = null
    imageElementsRef.current.clear()
    busyRef.current = false
    setIsPreparing(false)
    setCutRecordingIndex(null)
    reportStatus({ busy: false, error: '' })
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop())
    canvasStreamRef.current = null
  }, [reportStatus])

  const stopRecording = useCallback(() => {
    if (batchRef.current) batchRef.current.cancelled = true
    prepareTokenRef.current += 1
    if (busyRef.current && !recorderRef.current) cleanup()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [cleanup])

  const startRecording = useCallback(async (automaticCut = false, options = {}) => {
    const recordingImages = options.images || images
    const repeats = options.repeats || cutRepeats
    if (busyRef.current || (batchRef.current && !options.batch)) return
    if (automaticCut && (mode !== 'cut' || !recordingImages.length)) return
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      reportStatus({ busy: false, error: '이 브라우저에서는 영상 녹화를 지원하지 않습니다.' })
      return
    }
    const { width: stageW, height: stageH } = stageSizeRef.current
    if (mode !== 'cut' && (!stageW || !stageH)) return
    busyRef.current = true
    recorderRef.current = null
    const token = ++prepareTokenRef.current
    setIsPreparing(true)
    reportStatus({ busy: true, preparing: true, error: '' })
    try {
      await Promise.all(recordingImages.map(async (img) => {
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
      reportStatus({ busy: false, error: '이미지를 읽지 못했습니다. 파일을 확인해 주세요.' })
      return
    }
    if (token !== prepareTokenRef.current) return
    setIsPreparing(false)
    const totalFrames = recordingImages.length * repeats
    let hiddenAt = null
    let startedAt = null
    let previousIndex = -1

    const { width: outW, height: outH } = getRecordingSize(outputRatio)

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    const draw = (now) => {
      if (hiddenAt !== null) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }
      if (startedAt === null) startedAt = now
      let automaticIndex = null
      if (automaticCut) {
        const frame = Math.floor((now - startedAt) * cutSpeed / 1000)
        if (frame >= totalFrames) {
          recorderRef.current?.stop()
          return
        }
        automaticIndex = frame % recordingImages.length
        if (previousIndex !== automaticIndex) {
          previousIndex = automaticIndex
          setCutRecordingIndex(recordingImages[automaticIndex].previewIndex ?? automaticIndex)
        }
      }
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, outW, outH)

      if (mode === 'cut') {
        const idx = automaticIndex ?? (cutIndexRef ? cutIndexRef.current : 0)
        const imgData = recordingImages[idx]
        const imgEl = imgData ? imageElementsRef.current.get(imgData.url) : null
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          const size = Math.min(outW, outH) * (1000 / 1080)
          const x = (outW - size) / 2
          const y = (outH - size) / 2
          const side = Math.min(imgEl.naturalWidth, imgEl.naturalHeight)
          ctx.drawImage(imgEl, (imgEl.naturalWidth - side) / 2, (imgEl.naturalHeight - side) / 2, side, side, x, y, size, size)
        }
      } else {
        // Read the current preview size so resizing does not shift the output coordinates.
        const scale = outW / (stageSizeRef.current.width || stageW)
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
        reportStatus({ busy: false, error: '영상 녹화를 시작하지 못했습니다. 다른 브라우저에서 다시 시도해 주세요.' })
        return
      }
    }
    mimeRef.current = recorder.mimeType || mime

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    let finish
    const finished = new Promise((resolve) => { finish = resolve })
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current })
      const ext = mimeRef.current.startsWith('video/mp4') ? 'mp4' : 'webm'
      chunksRef.current = []
      if (!options.batch) downloadBlob(blob, `poster_trail.${ext}`)
      finish({ blob, ext })
      recorderRef.current = null
      cleanup()
      setIsRecording(false)
    }

    recorder.onerror = () => {
      recorder.onstop = null
      finish(null)
      if (recorder.state !== 'inactive') recorder.stop()
      recorderRef.current = null
      cleanup()
      setIsRecording(false)
      reportStatus({ busy: false, error: '녹화 중 오류가 발생했습니다. 다시 시도해 주세요.' })
    }
    try {
      recorder.start()
    } catch {
      recorder.onstop = null
      cleanup()
      reportStatus({ busy: false, error: '영상 녹화를 시작하지 못했습니다.' })
      return
    }
    recorderRef.current = recorder
    if (automaticCut) {
      const handleVisibility = () => {
        if (document.hidden && recorder.state === 'recording') {
          hiddenAt = performance.now()
          recorder.pause()
          reportStatus({ busy: true, paused: true, error: '' })
        } else if (!document.hidden && hiddenAt !== null && recorder.state === 'paused') {
          if (startedAt !== null) startedAt += performance.now() - hiddenAt
          hiddenAt = null
          recorder.resume()
          reportStatus({ busy: true, paused: false, error: '' })
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)
      visibilityCleanupRef.current = () => document.removeEventListener('visibilitychange', handleVisibility)
      handleVisibility()
    }
    if (automaticCut) setCutRecordingIndex(recordingImages[0].previewIndex ?? 0)
    reportStatus({ busy: true, preparing: false, error: '' })
    setIsRecording(true)
    return finished
  }, [outputRatio, reportStatus, cutRepeats, cutSpeed, onRecordingStatus, stopRecording, stageSizeRef, sizeRef, transformsRef, imageIndicesRef, images, count, placeholderColors, mode, cutIndexRef, cleanup])

  const startBatch = useCallback(async () => {
    if (busyRef.current || batchRef.current || !images.length || mode !== 'cut') return
    const groups = createCutBatches(images, cutBatchSize)
    const batch = { completed: 0, total: groups.length, range: '', cancelled: false }
    batchRef.current = batch
    const parts = []
    let zipError = null
    const zip = cutDownloadMode === 'zip' ? new Zip((error, data) => {
      if (error) zipError = error
      else parts.push(data)
    }) : null
    let errorMessage = ''
    try {
      for (const group of groups) {
        if (batch.cancelled) break
        batch.range = group.name
        reportStatus({ preparing: true, error: '' })
        const result = await startRecording(true, { images: group.images, repeats: cutBatchRepeats, batch: true })
        if (batch.cancelled) break
        if (!result || !result.blob.size) throw new Error('영상을 녹화하지 못했습니다. 이미지와 브라우저를 확인해 주세요.')
        if (zip) {
          const file = new ZipPassThrough(`${group.name}.${result.ext}`)
          zip.add(file)
          file.push(new Uint8Array(await result.blob.arrayBuffer()), true)
          if (zipError) throw zipError
        } else {
          downloadBlob(result.blob, `${group.name}.${result.ext}`)
        }
        batch.completed += 1
        reportStatus({ error: '' })
      }
    } catch (error) {
      errorMessage = error.message || '일괄 녹화 중 오류가 발생했습니다.'
    }
    if (batchRef.current !== batch) return
    if (zip) {
      zip.end()
      if (zipError) errorMessage = 'ZIP 파일을 만들지 못했습니다.'
      if (batch.completed && !zipError) downloadBlob(new Blob(parts, { type: 'application/zip' }), 'poster_reels.zip')
    }
    batchRef.current = null
    reportStatus({ busy: false, error: errorMessage,
      message: zipError ? '' : batch.completed ? `${batch.completed}개 영상 ${zip ? 'ZIP ' : ''}다운로드 요청 완료${batch.cancelled ? ' · 일괄 작업 중단됨' : ''}` : '저장할 완료 영상이 없습니다.' })
  }, [cutDownloadMode, images, mode, cutBatchSize, cutBatchRepeats, startRecording, reportStatus])

  useEffect(() => {
    if (cutBatchRequest === batchRequestRef.current) return
    batchRequestRef.current = cutBatchRequest
    startBatch()
  }, [cutBatchRequest, startBatch])

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
    if (batchRef.current) batchRef.current.cancelled = true
    batchRef.current = null
    visibilityCleanupRef.current?.()
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
      if (busyRef.current || batchRef.current) stopRecording()
      else startRecording()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, startRecording, stopRecording])

  return { isRecording, isPreparing, cutRecordingIndex }
}
