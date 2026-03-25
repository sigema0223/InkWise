// Path Trace animation — draws each path point by point with a moving pen dot
export class PathTraceAnimator {
  constructor(ctx, paths, hatchLines, style, speedLevel, onProgress, onDone) {
    this.ctx = ctx;
    this.style = style;
    this.onProgress = onProgress;
    this.onDone = onDone;
    this.cancelled = false;
    this.rafId = null;

    // Speed: paths per frame (1→2, 2→6, 3→16, 4→40, 5→80)
    this.pathsPerFrame = [2, 6, 16, 40, 80][Math.min(4, speedLevel - 1)];

    // Phase 1: contour paths (strong first), Phase 2: hatch lines
    this.phase = 0;
    this.allSegments = [
      ...paths.map(p => ({ points: p.points, lineWidth: lineWidthFromStrength(p.strength), isHatch: false })),
      ...hatchLines.map(l => ({ points: l.points, lineWidth: 0.4, isHatch: true }))
    ];
    this.segIdx = 0;
    this.total = this.allSegments.length;
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

    for (let i = 0; i < this.pathsPerFrame; i++) {
      if (this.segIdx >= this.total) {
        this._done();
        return;
      }

      const seg = this.allSegments[this.segIdx];
      this._drawSegment(seg);
      this.segIdx++;
    }

    const progress = this.segIdx / this.total;
    this.onProgress(progress, this.segIdx, this.total);

    this.rafId = requestAnimationFrame(() => this._frame());
  }

  _drawSegment(seg) {
    const ctx = this.ctx;
    const pts = seg.points;
    if (pts.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.strokeStyle = seg.isHatch ? this.style.hatch : this.style.line;
    ctx.lineWidth = seg.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = seg.isHatch ? 0.55 : 0.85;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Draw pen dot at last point
    const last = pts[pts.length - 1];
    this._drawPenDot(last.x, last.y);
  }

  _drawPenDot(x, y) {
    // Erase previous dot by redrawing bg in a small area — skip for performance,
    // just paint a small red dot that will be covered by subsequent strokes
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _done() {
    this.onProgress(1, this.total, this.total);
    this.onDone();
  }
}

function lineWidthFromStrength(strength) {
  // strength is 0–255, map to 0.5–2.0
  return 0.5 + (strength / 255) * 1.5;
}
