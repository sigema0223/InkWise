import { toGrayscale } from './core/grayscale.js';
import { gaussianBlur } from './core/blur.js';
import { sobelEdge, buildEdgeMask } from './core/edge.js';
import { extractPaths } from './core/pathExtractor.js';
import { buildHatchLines } from './core/hatching.js';
import { applyPaperTexture } from './core/texture.js';
import { PathTraceAnimator } from './animation/pathTrace.js';
import { ScanlineAnimator } from './animation/scanline.js';
import { RadialAnimator } from './animation/radial.js';

// ─── Styles ─────────────────────────────────────────────────────────────────
const STYLES = {
  ink:       { bg: '#f5f0e8', line: '#1a1a1a', hatch: '#333333' },
  blueprint: { bg: '#1a2744', line: '#5fa8d3', hatch: '#3d7aab' },
  pencil:    { bg: '#f8f6f0', line: '#555555', hatch: '#888888' },
};

// ─── State ───────────────────────────────────────────────────────────────────
let currentImage = null;
let currentAnimator = null;
let currentStyle = STYLES.ink;
let isProcessing = false;

// ─── DOM refs ────────────────────────────────────────────────────────────────
const uploadArea    = document.getElementById('upload-area');
const fileInput     = document.getElementById('file-input');
const canvasOriginal = document.getElementById('canvas-original');
const canvasResult   = document.getElementById('canvas-result');
const ctxOrig        = canvasOriginal.getContext('2d');
const ctxResult      = canvasResult.getContext('2d');

const styleButtons  = document.querySelectorAll('.style-btn');
const modeButtons   = document.querySelectorAll('.mode-btn');
const threshSlider  = document.getElementById('threshold');
const hatchSlider   = document.getElementById('hatch-density');
const speedSlider   = document.getElementById('speed');
const threshVal     = document.getElementById('threshold-val');
const hatchVal      = document.getElementById('hatch-val');
const speedVal      = document.getElementById('speed-val');
const replayBtn     = document.getElementById('replay-btn');
const downloadBtn   = document.getElementById('download-btn');
const progressBar   = document.getElementById('progress-bar');
const progressText  = document.getElementById('progress-text');
const statusInfo    = document.getElementById('status-info');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSelectedMode() {
  return document.querySelector('.mode-btn.active')?.dataset.mode ?? 'pathtrace';
}

function getThreshold() { return parseInt(threshSlider.value); }
function getHatchDensity() { return parseInt(hatchSlider.value); }
function getSpeed() { return parseInt(speedSlider.value); }

function setStatus(msg) {
  statusInfo.textContent = msg;
}

function setProgress(ratio, current, total) {
  const pct = Math.round(ratio * 100);
  progressBar.style.width = pct + '%';
  progressText.textContent = `${pct}%  (${current} / ${total})`;
}

// ─── Upload handling ─────────────────────────────────────────────────────────
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadImage(fileInput.files[0]);
});

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      renderOriginal(img);
      runPipeline();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function renderOriginal(img) {
  const maxW = canvasOriginal.offsetWidth || 600;
  const maxH = canvasOriginal.offsetHeight || 600;
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  canvasOriginal.width  = Math.round(img.width * scale);
  canvasOriginal.height = Math.round(img.height * scale);
  ctxOrig.drawImage(img, 0, 0, canvasOriginal.width, canvasOriginal.height);
}

// ─── Pipeline ────────────────────────────────────────────────────────────────
async function runPipeline() {
  if (!currentImage || isProcessing) return;
  isProcessing = true;

  if (currentAnimator) {
    currentAnimator.cancel();
    currentAnimator = null;
  }

  setStatus('Processing...');
  setProgress(0, 0, 1);

  // Yield to allow UI repaint
  await tick();

  const w = canvasOriginal.width;
  const h = canvasOriginal.height;
  canvasResult.width  = w;
  canvasResult.height = h;

  const style = currentStyle;
  const threshold = getThreshold();
  const density   = getHatchDensity();
  const speed     = getSpeed();
  const mode      = getSelectedMode();

  // 1. Draw source image and extract pixel data
  const offCanvas = new OffscreenCanvas(w, h);
  const offCtx = offCanvas.getContext('2d');
  offCtx.drawImage(currentImage, 0, 0, w, h);
  const rawData = offCtx.getImageData(0, 0, w, h);

  setStatus('Grayscale + Blur...');
  await tick();

  // 2. Grayscale
  let gray = toGrayscale(rawData);

  // 3. Gaussian blur
  gray = gaussianBlur(gray, w, h, 1);

  setStatus('Edge detection...');
  await tick();

  // 4. Sobel edges
  const { magnitude, direction } = sobelEdge(gray, w, h);
  const mask = buildEdgeMask(magnitude, w, h, threshold);

  setStatus('Path extraction...');
  await tick();

  // 5. Extract paths
  const paths = extractPaths(mask, magnitude, w, h);

  setStatus('Hatching...');
  await tick();

  // 6. Cross-hatching lines
  const hatchLines = buildHatchLines(gray, w, h, density);

  setStatus('Rendering texture...');
  await tick();

  // 7. Paper texture background
  applyPaperTexture(ctxResult, w, h, style);

  // 8. Animate
  setStatus(`Drawing (${mode})...`);

  const onProgress = (ratio, cur, total) => setProgress(ratio, cur, total);
  const onDone = () => {
    setStatus(`Done — ${paths.length} paths`);
    isProcessing = false;
  };

  if (mode === 'pathtrace') {
    currentAnimator = new PathTraceAnimator(ctxResult, paths, hatchLines, style, speed, onProgress, onDone);
    currentAnimator.start();
  } else if (mode === 'scanline' || mode === 'radial') {
    // Pre-render full drawing to off-screen, then animate reveal
    const preCanvas = new OffscreenCanvas(w, h);
    const preCtx = preCanvas.getContext('2d');
    applyPaperTexture(preCtx, w, h, style);
    renderAllPaths(preCtx, paths, hatchLines, style);
    const fullData = preCtx.getImageData(0, 0, w, h);

    if (mode === 'scanline') {
      currentAnimator = new ScanlineAnimator(ctxResult, fullData, style, speed, onProgress, onDone);
    } else {
      currentAnimator = new RadialAnimator(ctxResult, fullData, style, speed, onProgress, onDone);
    }
    currentAnimator.start();
  }
}

function renderAllPaths(ctx, paths, hatchLines, style) {
  for (const p of paths) {
    const pts = p.points;
    if (pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = style.line;
    ctx.lineWidth = 0.5 + (p.strength / 255) * 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.stroke();
  }
  for (const l of hatchLines) {
    const pts = l.points;
    if (pts.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = style.hatch;
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function tick() {
  return new Promise(r => setTimeout(r, 0));
}

// ─── Controls ────────────────────────────────────────────────────────────────
styleButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    styleButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStyle = STYLES[btn.dataset.style] ?? STYLES.ink;
    if (currentImage) runPipeline();
  });
});

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (currentImage) runPipeline();
  });
});

threshSlider.addEventListener('input', () => {
  threshVal.textContent = threshSlider.value;
  if (currentImage) runPipeline();
});

hatchSlider.addEventListener('input', () => {
  hatchVal.textContent = hatchSlider.value;
  if (currentImage) runPipeline();
});

speedSlider.addEventListener('input', () => {
  speedVal.textContent = speedSlider.value;
});

replayBtn.addEventListener('click', () => {
  if (currentImage) runPipeline();
});

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'inkwise-drawing.png';
  link.href = canvasResult.toDataURL('image/png');
  link.click();
});

// ─── Init ────────────────────────────────────────────────────────────────────
setStatus('Upload an image to begin.');
