// Sobel edge detection — returns { magnitude, direction } Float32Arrays
export function sobelEdge(gray, width, height) {
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);

  const kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const val = gray[(y + dy) * width + (x + dx)];
          const ki = (dy + 1) * 3 + (dx + 1);
          gx += val * kx[ki];
          gy += val * ky[ki];
        }
      }
      const idx = y * width + x;
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }

  // Normalize magnitude to 0–255
  let max = 0;
  for (let i = 0; i < magnitude.length; i++) {
    if (magnitude[i] > max) max = magnitude[i];
  }
  if (max > 0) {
    for (let i = 0; i < magnitude.length; i++) {
      magnitude[i] = (magnitude[i] / max) * 255;
    }
  }

  return { magnitude, direction };
}

// Build binary edge mask from magnitude using threshold
export function buildEdgeMask(magnitude, width, height, threshold = 40) {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < magnitude.length; i++) {
    mask[i] = magnitude[i] >= threshold ? 1 : 0;
  }
  return mask;
}
