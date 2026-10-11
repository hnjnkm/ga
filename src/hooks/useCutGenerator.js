import { useEffect, useRef, useState } from 'react'
import { Zip, ZipPassThrough } from 'fflate'
import { createCutBatches } from '../utils/cutBatch.js'
import { getRecordingSize } from '../utils/recordingSize.js'

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export default function useCutGenerator(options) {
  const latest = useRef(options)
  latest.current = options
  const requests = useRef({ single: options.cutExportRequest, batch: options.cutBatchRequest, stop: options.stopRequest })
  const jobRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [index, setIndex] = useState(null)

  async function run(batchMode) {
    const { mode, images, cutSpeed, cutRepeats, cutBatchSize, cutBatchRepeats, cutDownloadMode, outputRatio, onRecordingStatus } = latest.current
    if (mode !== 'cut-generate' || jobRef.current || !images.length) return
    const groups = createCutBatches(images, batchMode ? cutBatchSize : images.length)
    const job = { cancelled: false, completed: 0, worker: null, reject: null }
    jobRef.current = job
    setBusy(true)
    const parts = []
    let zipError = null
    const zip = batchMode && cutDownloadMode === 'zip' ? new Zip((error, data) => {
      if (error) zipError = error
      else parts.push(data)
    }) : null
    let errorMessage = ''
    try {
      for (const group of groups) {
        if (job.cancelled) break
        const report = (progress = 0) => onRecordingStatus({ busy: true, generating: true, batch: batchMode,
          completed: job.completed, total: groups.length, range: group.name, progress, error: '' })
        report()
        const buffer = await new Promise((resolve, reject) => {
          const worker = new Worker(new URL('../workers/cutGenerator.js', import.meta.url), { type: 'module' })
          job.worker = worker
          job.reject = reject
          worker.onmessage = ({ data }) => {
            if (data.type === 'progress') { setIndex(data.index); report(data.progress) }
            else if (data.type === 'done') resolve(data.buffer)
            else reject(new Error(data.message))
          }
          worker.onerror = () => reject(new Error('영상 생성 작업을 시작하지 못했습니다. 최신 Chrome에서 다시 시도해 주세요.'))
          worker.postMessage({ images: group.images, repeats: batchMode ? cutBatchRepeats : cutRepeats,
            speed: cutSpeed, ...getRecordingSize(outputRatio) })
        })
        job.worker.terminate()
        job.worker = null
        job.reject = null
        if (job.cancelled) break
        if (zip) {
          const file = new ZipPassThrough(`${group.name}.mp4`)
          zip.add(file)
          file.push(new Uint8Array(buffer), true)
          if (zipError) throw zipError
        } else download(new Blob([buffer], { type: 'video/mp4' }), `${group.name}.mp4`)
        job.completed++
      }
    } catch (error) {
      if (!job.cancelled) errorMessage = error.message || '영상 생성에 실패했습니다.'
    } finally {
      job.worker?.terminate()
    }
    if (jobRef.current !== job) return
    if (zip) {
      zip.end()
      if (zipError) errorMessage = 'ZIP 생성에 실패했습니다.'
      else if (job.completed) download(new Blob(parts, { type: 'application/zip' }), 'poster_reels.zip')
    }
    jobRef.current = null
    setBusy(false)
    setIndex(null)
    onRecordingStatus({ busy: false, error: errorMessage, message: zipError ? '' :
      `${job.completed}개 영상 ${zip ? 'ZIP ' : ''}다운로드 요청 완료${job.cancelled ? ' · 생성 중단됨' : ''}` })
  }

  useEffect(() => {
    const old = requests.current
    if (options.cutExportRequest !== old.single) { old.single = options.cutExportRequest; run(false) }
    if (options.cutBatchRequest !== old.batch) { old.batch = options.cutBatchRequest; run(true) }
    if (options.stopRequest !== old.stop) {
      old.stop = options.stopRequest
      const job = jobRef.current
      if (job) { job.cancelled = true; job.worker?.terminate(); job.reject?.(new Error('cancelled')) }
    }
  }, [options.cutExportRequest, options.cutBatchRequest, options.stopRequest])

  useEffect(() => () => {
    const job = jobRef.current
    jobRef.current = null
    if (job) { job.cancelled = true; job.worker?.terminate(); job.reject?.(new Error('cancelled')) }
  }, [])

  return { busy, index }
}
