// CyberTrace — Shared Utility Library
'use strict';

const CyberUtils = (() => {

  // ── Clipboard ────────────────────────────────────────────────────────────
  async function copyToClipboard(text, successMsg = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg, 'success');
      return true;
    } catch (err) {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try {
        document.execCommand('copy');
        showToast(successMsg, 'success');
        return true;
      } catch (e) {
        showToast('Copy failed — please copy manually.', 'error');
        return false;
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  // ── File Download ─────────────────────────────────────────────────────────
  function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    requestAnimationFrame(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }

  // ── GeoJSON Export ───────────────────────────────────────────────────────
  function buildGeoJson(telemetryData) {
    const { latitude, longitude, accuracy, fullAddress, timestamp } = telemetryData;
    return JSON.stringify({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        properties: {
          captured_at: timestamp || new Date().toISOString(),
          accuracy_meters: accuracy || null,
          full_address: fullAddress || 'Unknown',
          source: 'CyberTrace Authorized GPS',
          app_version: '1.0.4'
        }
      }]
    }, null, 2);
  }

  function downloadGeoJson(telemetryData) {
    const filename = `cybertrace_location_${Date.now()}.geojson`;
    downloadFile(filename, buildGeoJson(telemetryData), 'application/geo+json');
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  function objectsToCsv(rows) {
    if (!rows || !rows.length) return '';
    const headers = Object.keys(rows[0]);
    const lines = rows.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headers.join(','), ...lines].join('\r\n');
  }

  function downloadCsv(rows, filename = 'cybertrace_export.csv') {
    downloadFile(filename, objectsToCsv(rows), 'text/csv;charset=utf-8;');
  }

  // ── Audit Report Builder ─────────────────────────────────────────────────
  function buildAuditReport(terminalLogs) {
    const now = new Date();
    const header = [
      '================================================================',
      '  CYBERTRACE SECURITY AUDIT REPORT',
      `  Generated: ${now.toUTCString()}`,
      `  Local Time: ${now.toLocaleString()}`,
      `  Session Duration: ${Math.round(performance.now() / 1000)}s`,
      '================================================================',
      ''
    ].join('\n');

    const body = terminalLogs.map(log =>
      `[${log.fullTime || log.time}] [${log.level.padEnd(5)}] ${log.message}`
    ).join('\n');

    const footer = [
      '',
      '----------------------------------------------------------------',
      '  END OF REPORT — CyberTrace Security Lab © 2026',
      '  ETHICAL USE ONLY — Authorized Access Research Tool',
      '================================================================'
    ].join('\n');

    return header + (body || '  (No events logged)') + footer;
  }

  // ── Toast Notification ───────────────────────────────────────────────────
  let toastTimeout = null;
  function showToast(message, type = 'info', duration = 3000) {
    let toast = document.getElementById('cyberToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cyberToast';
      toast.style.cssText = `
        position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
        padding: 0.75rem 1.25rem; border-radius: 10px;
        font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;
        font-weight: 600; letter-spacing: 0.03em;
        display: flex; align-items: center; gap: 0.5rem;
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        transform: translateY(20px); opacity: 0;
        transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    const styles = {
      success: { bg: 'rgba(16,185,129,0.18)', border: '#10b981', icon: '✅' },
      error:   { bg: 'rgba(239,68,68,0.18)',  border: '#ef4444', icon: '❌' },
      warn:    { bg: 'rgba(245,158,11,0.18)', border: '#f59e0b', icon: '⚠️' },
      info:    { bg: 'rgba(0,242,254,0.12)',  border: '#00f2fe', icon: 'ℹ️' }
    };
    const s = styles[type] || styles.info;

    toast.style.background = s.bg;
    toast.style.borderColor = s.border;
    toast.style.color = '#e2e8f0';
    toast.innerHTML = `<span>${s.icon}</span><span>${message}</span>`;

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
    }, duration);
  }

  // ── Format Helpers ────────────────────────────────────────────────────────
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function formatCoord(val, decimals = 6) {
    return typeof val === 'number' ? val.toFixed(decimals) : '--';
  }

  function sanitizeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function timeSince(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  // ── Service Worker Registration ───────────────────────────────────────────
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => {
            console.log('[CyberTrace] Service Worker registered:', reg.scope);
            if (window.logCyberEvent) {
              window.logCyberEvent('INFO', 'Service Worker registered — offline caching active.');
            }
          })
          .catch(err => {
            console.warn('[CyberTrace] Service Worker registration failed:', err);
          });
      });
    }
  }

  // Public API
  return {
    copyToClipboard,
    downloadFile,
    buildGeoJson,
    downloadGeoJson,
    downloadCsv,
    objectsToCsv,
    buildAuditReport,
    showToast,
    formatBytes,
    formatCoord,
    sanitizeHtml,
    timeSince,
    registerServiceWorker
  };
})();

window.CyberUtils = CyberUtils;
