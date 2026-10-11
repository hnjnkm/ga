import test from 'node:test'
import assert from 'node:assert/strict'
import { createCutBatches } from '../src/utils/cutBatch.js'

test('1000 filenames sort numerically into 100 named groups without dropping images', () => {
  const images = Array.from({ length: 1000 }, (_, i) => ({ name: `${String(i + 1).padStart(2, '0')}.png`, url: `image:${i}` })).reverse()
  const batches = createCutBatches(images, 10)
  assert.equal(batches.length, 100)
  assert.equal(batches[0].name, '01-10')
  assert.equal(batches.at(-1).name, '991-1000')
  assert.deepEqual(batches.flatMap((b) => b.images.map((image) => image.name)), images.map((i) => i.name).reverse())
  for (const image of batches.flatMap((b) => b.images)) assert.equal(images[image.previewIndex].url, image.url)
})

test('partial final group, numeric order and duplicate names produce usable unique filenames', () => {
  assert.deepEqual(createCutBatches([{ name: '10.png' }, { name: '2.png' }, { name: '1.png' }], 2).map((b) => b.name), ['1-2', '10-10'])
  assert.deepEqual(createCutBatches([{ name: '../x.png' }, { name: '../x.png' }], 1).map((b) => b.name), ['.._x-.._x', '.._x-.._x (2)'])
  assert.deepEqual(createCutBatches([], 10), [])
})
