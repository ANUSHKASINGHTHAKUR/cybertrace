// CyberTrace — Canvas Chart Utilities (Zero-dependency)
// Provides: DonutChart, BarChart, SparklineChart

'use strict';

// ── Shared Helpers ────────────────────────────────────────────────────────
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getThemeColors() {
  return {
    cyan:    '#00f2fe',
    blue:    '#3b82f6',
    emerald: '#10b981',
    amber:   '#f59e0b',
    rose:    '#ef4444',
    purple:  '#8b5cf6',
    slate:   '#334155',
    text:    '#94a3b8',
    bg:      '#0e1524'
  };
}

// ── DonutChart: Risk Score Visualizer ────────────────────────────────────
class DonutChart {
  /**
   * @param {string} canvasId  - ID of the <canvas> element
   * @param {object} options   - { value: 0-100, label, colorHigh, colorLow }
   */
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = Object.assign({
      value: 0,
      label: 'Risk',
      maxValue: 100,
      colorFill: '#00f2fe',
      colorTrack: '#1e293b',
      colorText: '#ffffff',
      lineWidth: 14,
      fontSize: 22
    }, options);
    this.animValue = 0;
    this.targetValue = this.options.value;
  }

  _getColorForValue(v) {
    if (v <= 30) return '#10b981';  // emerald — low
    if (v <= 60) return '#f59e0b';  // amber — medium
    return '#ef4444';               // rose — high
  }

  draw(value) {
    const c = this.canvas;
    const ctx = this.ctx;
    if (!ctx) return;

    const w = c.width = c.offsetWidth  || 160;
    const h = c.height = c.offsetHeight || 160;
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(cx, cy) - this.options.lineWidth;
    const lw = this.options.lineWidth;
    const pct = Math.max(0, Math.min(100, value)) / 100;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * pct);
    const color = this._getColorForValue(value);

    ctx.clearRect(0, 0, w, h);

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = this.options.colorTrack;
    ctx.lineWidth = lw;
    ctx.stroke();

    // Glow effect
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Value arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Center text — value
    ctx.fillStyle = this.options.colorText;
    ctx.font = `bold ${this.options.fontSize}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(value), cx, cy - 8);

    // Center text — label
    ctx.fillStyle = '#64748b';
    ctx.font = `10px 'Inter', sans-serif`;
    ctx.fillText(this.options.label, cx, cy + 12);
  }

  animateTo(targetValue, duration = 800) {
    const start = this.animValue;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animValue = start + (targetValue - start) * eased;
      this.draw(this.animValue);
      if (progress < 1) requestAnimationFrame(tick);
      else this.animValue = targetValue;
    };
    requestAnimationFrame(tick);
  }
}

// ── BarChart: Carrier / Country Signal Bars ───────────────────────────────
class BarChart {
  /**
   * @param {string} canvasId
   * @param {Array}  data     - [{ label, value, color? }]
   * @param {object} options
   */
  constructor(canvasId, data = [], options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.options = Object.assign({
      maxValue: 100,
      barColor: '#00f2fe',
      labelColor: '#94a3b8',
      valueColor: '#ffffff',
      gridColor: 'rgba(255,255,255,0.05)',
      bgColor: 'transparent',
      barRadius: 4,
      padding: 20,
      barGap: 10
    }, options);
  }

  draw() {
    const c = this.canvas;
    const ctx = this.ctx;
    if (!ctx || !this.data.length) return;

    const w = c.width = c.offsetWidth || 300;
    const h = c.height = c.offsetHeight || 160;
    const { padding, barGap } = this.options;
    const colors = getThemeColors();

    ctx.clearRect(0, 0, w, h);

    // Background
    if (this.options.bgColor !== 'transparent') {
      ctx.fillStyle = this.options.bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    const n = this.data.length;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2 - 16; // 16px for labels
    const barW = Math.max(8, (chartW - barGap * (n - 1)) / n);
    const maxVal = Math.max(...this.data.map(d => d.value), this.options.maxValue);

    this.data.forEach((item, i) => {
      const barH = (item.value / maxVal) * chartH;
      const x = padding + i * (barW + barGap);
      const y = padding + chartH - barH;
      const color = item.color || this.options.barColor;

      // Glow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      // Bar
      ctx.fillStyle = hexToRgba(color, 0.85);
      this._roundRect(ctx, x, y, barW, barH, this.options.barRadius);
      ctx.fill();
      ctx.restore();

      // Label
      ctx.fillStyle = this.options.labelColor;
      ctx.font = `9px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barW / 2, h - 5);

      // Value on top
      ctx.fillStyle = this.options.valueColor;
      ctx.font = `bold 10px 'JetBrains Mono', monospace`;
      ctx.fillText(item.value, x + barW / 2, y - 4);
    });
  }

  _roundRect(ctx, x, y, w, h, r) {
    if (h < r) r = h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ── SparklineChart: Real-time telemetry timeline ──────────────────────────
class SparklineChart {
  /**
   * @param {string} canvasId
   * @param {object} options  - { maxPoints, color, fillOpacity, lineWidth }
   */
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.points = [];
    this.options = Object.assign({
      maxPoints: 40,
      color: '#00f2fe',
      fillOpacity: 0.12,
      lineWidth: 2,
      padding: 6,
      animated: true
    }, options);
  }

  push(value) {
    this.points.push(value);
    if (this.points.length > this.options.maxPoints) {
      this.points.shift();
    }
    this.draw();
  }

  draw() {
    const c = this.canvas;
    const ctx = this.ctx;
    if (!ctx || this.points.length < 2) return;

    const w = c.width = c.offsetWidth || 200;
    const h = c.height = c.offsetHeight || 60;
    const { padding, color, lineWidth, fillOpacity } = this.options;
    const pts = this.points;

    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...pts);
    const max = Math.max(...pts) || 1;
    const range = max - min || 1;

    const xStep = (w - padding * 2) / (pts.length - 1);
    const coords = pts.map((v, i) => ({
      x: padding + i * xStep,
      y: h - padding - ((v - min) / range) * (h - padding * 2)
    }));

    // Fill area
    ctx.beginPath();
    ctx.moveTo(coords[0].x, h - padding);
    coords.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(coords[coords.length - 1].x, h - padding);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, hexToRgba(color, fillOpacity));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length - 1; i++) {
      const mx = (coords[i].x + coords[i + 1].x) / 2;
      const my = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, mx, my);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Latest value dot
    const last = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// Expose globally
window.CyberCharts = { DonutChart, BarChart, SparklineChart };
