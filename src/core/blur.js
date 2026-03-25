// Gaussian blur on Float32Array grayscale data
export function gaussianBlur(gray, width, height, radius = 1) {
  const kernel = buildGaussianKernel(radius);
  const size = kernel.length;
  const half = Math.floor(size / 2);
  const tmp = new Float32Array(width * height);
  const out = new Float32Array(width * height);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, weight = 0;
      for (let k = -half; k <= half; k++) {
        const nx = x + k;
        if (nx < 0 || nx >= width) continue;
        const w = kernel[k + half];
        sum += gray[y * width + nx] * w;
        weight += w;
      }
      tmp[y * width + x] = sum / weight;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, weight = 0;
      for (let k = -half; k <= half; k++) {
        const ny = y + k;
        if (ny < 0 || ny >= height) continue;
        const w = kernel[k + half];
        sum += tmp[ny * width + x] * w;
        weight += w;
      }
      out[y * width + x] = sum / weight;
    }
  }

  return out;
}

function buildGaussianKernel(radius) {
  const size = radius * 2 + 1;
  const sigma = radius / 2.0 || 1;
  const kernel = new Float32Array(size);
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;
  return kernel;
}
