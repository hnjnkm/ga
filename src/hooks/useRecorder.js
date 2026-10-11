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
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop())
    canvasStreamRef.current = null
  }, [])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(() => {
    const { width: stageW, height: stageH } = stageSizeRef.current
    if (!stageW || !stageH) return

    const scale = Math.min(MAX_SCALE, MAX_DIMENSION / Math.max(stageW, stageH))
    const outW = Math.round(stageW * scale)
    const outH = Math.round(stageH * scale)

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, outW, outH)

      if (mode === 'cut') {
        const idx = cutIndexRef ? cutIndexRef.current : 0
        const imgData = images[idx]
        const imgEl = imgData ? imageElementsRef.current.get(imgData.url) : null
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          const size = Math.min(outW, outH) * (1000 / 1080)
          const x = (outW - size) / 2
          const y = (outH - size) / 2
          ctx.drawImage(imgEl, x, y, size, size)
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
        return
      }
    }

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
      cleanup()
      setIsRecording(false)
    }

    recorder.start()
    recorderRef.current = recorder
    setIsRecording(true)
  }, [stageSizeRef, sizeRef, transformsRef, imageIndicesRef, images, count, placeholderColors, mode, cutIndexRef, cleanup])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() !== 'r') return
      const target = e.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (isRecording) stopRecording()
      else startRecording()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, startRecording, stopRecording])

  return { isRecording }
}
