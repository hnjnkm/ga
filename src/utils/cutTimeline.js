export function* cutTimeline(imageCount, repeats, speed) {
  if (!Number.isInteger(imageCount) || imageCount < 1 || !Number.isInteger(repeats) || repeats < 1 || !Number.isFinite(speed) || speed <= 0) {
    throw new Error('이미지 수, 반복 횟수, 전환 속도를 확인해 주세요.')
  }
  for (let frame = 0; frame < imageCount * repeats; frame++) {
    yield { index: frame % imageCount, timestamp: frame / speed, duration: 1 / speed }
  }
}
