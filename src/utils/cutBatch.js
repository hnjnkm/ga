export function createCutBatches(images, size) {
  const sorted = images.map((image, index) => ({ ...image, previewIndex: index }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'en', { numeric: true }));
  const stem = (image) => (image.name || String(image.previewIndex + 1))
    .replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '') || 'image';
  const groups = [];
  const names = new Set();
  for (let i = 0; i < sorted.length; i += size) {
    const group = sorted.slice(i, i + size);
    const base = `${stem(group[0])}-${stem(group[group.length - 1])}`;
    let name = base;
    for (let suffix = 2; names.has(name); suffix++) name = `${base} (${suffix})`;
    names.add(name);
    groups.push({ images: group, name });
  }
  return groups;
}
