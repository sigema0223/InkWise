// Generate paper texture noise overlay on canvas context
export function applyPaperTexture(ctx, width, height, style) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Parse background color for base
  const bg = hexToRgb(style.bg);

  for (let i = 0; i < width * height; i++) {
    // Simple pseudo-random noise
    const noise = (Math.random() - 0.5) * 18;
    data[i * 4]     = clamp(bg.r + noise);
    data[i * 4 + 1] = clamp(bg.g + noise);
    data[i * 4 + 2] = clamp(bg.b + noise);
    data[i * 4 + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
