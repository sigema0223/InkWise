// Extract connected paths from edge mask using 8-directional chaining
export function extractPaths(mask, magnitude, width, height) {
  const visited = new Uint8Array(width * height);
  const paths = [];

  // 8 directions: [dx, dy]
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1]
  ];

  // Collect all edge pixels sorted by strength descending
  const edgePixels = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (mask[idx]) {
        edgePixels.push({ x, y, strength: magnitude[idx] });
      }
    }
  }
  edgePixels.sort((a, b) => b.strength - a.strength);

  for (const start of edgePixels) {
    const startIdx = start.y * width + start.x;
    if (visited[startIdx]) continue;

    const path = [{ x: start.x, y: start.y }];
    visited[startIdx] = 1;

    let cx = start.x;
    let cy = start.y;
    let prevDx = 0;
    let prevDy = 0;

    // Walk the path greedily
    while (true) {
      let bestScore = -Infinity;
      let bestX = -1, bestY = -1;
      let bestDx = 0, bestDy = 0;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nidx = ny * width + nx;
        if (!mask[nidx] || visited[nidx]) continue;

        // Score = edge strength + direction continuity bonus
        let score = magnitude[nidx];
        if (prevDx !== 0 || prevDy !== 0) {
          if (dx === prevDx && dy === prevDy) score += 0.3 * 255;
        }

        if (score > bestScore) {
          bestScore = score;
          bestX = nx;
          bestY = ny;
          bestDx = dx;
          bestDy = dy;
        }
      }

      if (bestX === -1) break;

      const nidx = bestY * width + bestX;
      visited[nidx] = 1;
      path.push({ x: bestX, y: bestY });
      cx = bestX;
      cy = bestY;
      prevDx = bestDx;
      prevDy = bestDy;
    }

    if (path.length >= 4) {
      // Compute average strength for sorting
      let totalStrength = 0;
      for (const pt of path) {
        totalStrength += magnitude[pt.y * width + pt.x];
      }
      paths.push({ points: path, strength: totalStrength / path.length });
    }
  }

  // Sort strong contours first
  paths.sort((a, b) => b.strength - a.strength);
  return paths;
}
