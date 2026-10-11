import test from 'node:test'
import assert from 'node:assert/strict'
import { getRecordingSize } from '../src/utils/recordingSize.js'

test('recording dimensions use the selected ratio, independently of the preview viewport', () => {
  for (const [ratio, width, height] of [
    ['9:16', 1080, 1920], ['1:1', 1080, 1080], ['16:9', 1920, 1080], ['4:5', 1080, 1350],
  ]) assert.deepEqual(getRecordingSize(ratio), { width, height })
})
