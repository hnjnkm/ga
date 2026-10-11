const OUTPUT_SIZES = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
}

export function getRecordingSize(ratio) {
  return OUTPUT_SIZES[ratio] || OUTPUT_SIZES['9:16']
}
