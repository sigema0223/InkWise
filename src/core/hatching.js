// Cross-hatching based on brightness values
export function buildHatchLines(gray, width, height, density = 50) {
  const lines = [];
  if (density === 0) return lines;

  // Step between hatch lines, inversely proportional to density
  const step = Math.max(2, Math.round(20 - density * 0.16));

  // Primary hatch direction: 45°
  for (let d = -height; d < width + height; d += step) {
    const pts = [];
    for (let x = 0; x < width; x++) {
      const y = x - d;
      if (y < 0 || y >= height) continue;
      const brightness = gray[Math.round(y) * width + Math.round(x)];
      if (brightness < 160) {
        pts.push({ x, y });
      }
    }
    if (pts.length >= 2) lines.push({ points: pts, type: 'hatch1' });
  }

  // Cross hatch at -45° for very dark regions
  for (let d = 0; d < width + height; d += step) {
    const pts = [];
    for (let x = 0; x < width; x++) {
      const y = d - x;
      if (y < 0 || y >= height) continue;
      const brightness = gray[Math.round(y) * width + Math.round(x)];
      if (brightness < 80) {
        pts.push({ x, y });
      }
    }
    if (pts.length >= 2) lines.push({ points: pts, type: 'hatch2' });
  }

  return lines;
}
