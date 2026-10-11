import test from 'node:test'
import assert from 'node:assert/strict'
import { cutTimeline } from '../src/utils/cutTimeline.js'

test('10 images repeat exactly three times over 15 seconds at two images per second', () => {
  const frames = [...cutTimeline(10, 3, 2)]
  assert.deepEqual(frames.map((f) => f.index), Array.from({ length: 30 }, (_, i) => i % 10))
  assert.equal(frames[0].timestamp, 0)
  assert.equal(frames.at(-1).timestamp + frames.at(-1).duration, 15)
  for (let i = 0; i < frames.length; i++) {
    assert.equal(frames[i].timestamp, i / 2)
    assert.equal(frames[i].duration, 0.5)
  }
})

test('single image, fractional frame durations and partial groups preserve full durations', () => {
  assert.deepEqual([...cutTimeline(1, 3, 2)].map((f) => f.index), [0, 0, 0])
  const frames = [...cutTimeline(3, 3, 7)]
  assert.equal(frames.length, 9)
  assert(Math.abs(frames.at(-1).timestamp + frames.at(-1).duration - 9 / 7) < 1e-12)
  assert.throws(() => [...cutTimeline(0, 3, 2)])
  assert.throws(() => [...cutTimeline(3, 0, 2)])
  assert.throws(() => [...cutTimeline(3, 3, 0)])
})
