// Scanline animation — reveals drawing top to bottom
export class ScanlineAnimator {
  constructor(ctx, fullImageData, style, speedLevel, onProgress, onDone) {
    this.ctx = ctx;
    this.fullImageData = fullImageData;
    this.style = style;
    this.onProgress = onProgress;
    this.onDone = onDone;
    this.cancelled = false;
    this.rafId = null;

    this.height = fullImageData.height;
    this.width = fullImageData.width;
    this.currentY = 0;

    // Lines per frame by speed level
    this.linesPerFrame = [1, 3, 6, 12, 24][Math.min(4, speedLevel - 1)];
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
    const end = Math.min(this.currentY + this.linesPerFrame, this.height);

    // Draw the revealed band
    for (let y = this.currentY; y < end; y++) {
      const slice = new ImageData(
        this.fullImageData.data.slice(y * this.width * 4, (y + 1) * this.width * 4),
        this.width,
        1
      );
      ctx.putImageData(slice, 0, y);
    }

    this.currentY = end;

    // Draw scan line indicator
    ctx.clearRect(0, this.currentY, this.width, 2);
    ctx.fillStyle = '#e63946';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, this.currentY, this.width, 2);
    ctx.globalAlpha = 1;

    const progress = this.currentY / this.height;
    this.onProgress(progress, this.currentY, this.height);

    if (this.currentY >= this.height) {
      this._done();
      return;
    }

    this.rafId = requestAnimationFrame(() => this._frame());
  }

  _done() {
    this.onProgress(1, this.height, this.height);
    this.onDone();
  }
}
