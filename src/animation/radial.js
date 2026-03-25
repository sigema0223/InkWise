// Radial animation — reveals drawing from center outward
export class RadialAnimator {
  constructor(ctx, fullImageData, style, speedLevel, onProgress, onDone) {
    this.ctx = ctx;
    this.fullImageData = fullImageData;
    this.style = style;
    this.onProgress = onProgress;
    this.onDone = onDone;
    this.cancelled = false;
    this.rafId = null;

    this.width = fullImageData.width;
    this.height = fullImageData.height;
    this.cx = Math.floor(this.width / 2);
    this.cy = Math.floor(this.height / 2);
    this.maxRadius = Math.ceil(Math.sqrt(this.cx * this.cx + this.cy * this.cy));
    this.currentRadius = 0;

    // Radius increments per frame
    this.radiusPerFrame = [2, 5, 10, 20, 40][Math.min(4, speedLevel - 1)];

    // Pre-process full data into RGBA for pixel lookup
    this.pixels = this.fullImageData.data;
  }

  start() {
    this._frame();
  }

  cancel() {
    this.cancelled = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  _frame() {
    if (this.cancelled) return;

    const ctx = this.ctx;
    const { width, height, cx, cy } = this;

    const endRadius = Math.min(this.currentRadius + this.radiusPerFrame, this.maxRadius);

    // For each pixel in the ring from currentRadius to endRadius
    const r1sq = this.currentRadius * this.currentRadius;
    const r2sq = endRadius * endRadius;

    // Bounding box of the ring
    const x0 = Math.max(0, cx - endRadius);
    const x1 = Math.min(width - 1, cx + endRadius);
    const y0 = Math.max(0, cy - endRadius);
    const y1 = Math.min(height - 1, cy + endRadius);

    const imgData = ctx.createImageData(x1 - x0 + 1, y1 - y0 + 1);

    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = px - cx;
        const dy = py - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq > r2sq) continue;

        const srcIdx = (py * width + px) * 4;
        const dstIdx = ((py - y0) * (x1 - x0 + 1) + (px - x0)) * 4;
        imgData.data[dstIdx]     = this.pixels[srcIdx];
        imgData.data[dstIdx + 1] = this.pixels[srcIdx + 1];
        imgData.data[dstIdx + 2] = this.pixels[srcIdx + 2];
        imgData.data[dstIdx + 3] = this.pixels[srcIdx + 3];
      }
    }

    ctx.putImageData(imgData, x0, y0);

    // Draw radial indicator ring
    ctx.beginPath();
    ctx.arc(cx, cy, endRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    this.currentRadius = endRadius;

    const progress = endRadius / this.maxRadius;
    this.onProgress(progress, endRadius, this.maxRadius);

    if (this.currentRadius >= this.maxRadius) {
      this._done();
      return;
    }

    this.rafId = requestAnimationFrame(() => this._frame());
  }

  _done() {
    this.onProgress(1, this.maxRadius, this.maxRadius);
    this.onDone();
  }
}
