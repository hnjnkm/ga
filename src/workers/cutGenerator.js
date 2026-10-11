import { Output, Mp4OutputFormat, BufferTarget, CanvasSource } from 'mediabunny'
import { cutTimeline } from '../utils/cutTimeline.js'

self.onmessage = async ({ data: { images, repeats, speed, width, height } }) => {
  let output
  const bitmaps = []
  try {
    if (!self.VideoEncoder || !self.OffscreenCanvas) throw new Error('최신 Chrome에서 컷 생성을 사용해 주세요. 이 브라우저는 영상 인코딩을 지원하지 않습니다.')
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() })
    const source = new CanvasSource(canvas, { codec: 'avc', bitrate: 8_000_000 })
    output.addVideoTrack(source, { frameRate: speed })
    for (const image of images) {
      const response = await fetch(image.url)
      if (!response.ok) throw new Error(`이미지를 읽지 못했습니다: ${image.name}`)
      bitmaps.push(await createImageBitmap(await response.blob()))
    }
    await output.start()
    const total = images.length * repeats
    let completed = 0
    for (const { index, timestamp, duration } of cutTimeline(images.length, repeats, speed)) {
      const image = bitmaps[index]
      const side = Math.min(image.width, image.height)
      const size = Math.min(width, height) * (1000 / 1080)
      context.fillStyle = '#000'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side,
        (width - size) / 2, (height - size) / 2, size, size)
      await source.add(timestamp, duration, { keyFrame: true })
      self.postMessage({ type: 'progress', index: images[index].previewIndex, progress: ++completed / total })
    }
    await output.finalize()
    const buffer = output.target.buffer
    self.postMessage({ type: 'done', buffer }, [buffer])
  } catch (error) {
    await output?.cancel().catch(() => {})
    self.postMessage({ type: 'error', message: error.message || 'MP4 생성에 실패했습니다.' })
  } finally {
    bitmaps.forEach((image) => image.close())
  }
}
