// CyberTrace Master Application Controller
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Engines
  const osintEngine = new PhoneOsintEngine(window.PHONE_DATABASE);
  const geoEngine = new GeoTrackerEngine("liveGeoMap");
  const nominalMapEngine = new GeoTrackerEngine("osintMap");
  const telecomLab = new TelecomLab();

  // Terminal Logs State
  const terminalLogs = [];

  // Expose global log function
  window.logCyberEvent = (level, message) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const logItem = { level, message, time: timeStr, fullTime: now.toISOString() };
    terminalLogs.push(logItem);

    const logContainer = document.getElementById("terminalOutput");
    if (logContainer) {
      const line = document.createElement("div");
      line.className = `log-line log-${level.toLowerCase()}`;
      line.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-badge badge-${level.toLowerCase()}">${level}</span>
        <span class="log-msg">${escapeHtml(message)}</span>
      `;
      logContainer.appendChild(line);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  };

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Live HUD Clock
  function updateHudClock() {
    const now = new Date();
    const utcEl = document.getElementById("hudUtcClock");
    const localEl = document.getElementById("hudLocalClock");
    
    if (utcEl) {
      utcEl.textContent = now.toISOString().replace("T", " ").replace("Z", " UTC");
    }
    if (localEl) {
      localEl.textContent = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " Local";
    }
  }
  setInterval(updateHudClock, 500);
  updateHudClock();

  // Initialize Telecom Lab
  telecomLab.init();

  // Tab Navigation Handling
  const navTabs = document.querySelectorAll(".nav-tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  navTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      navTabs.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      // Handle Map invalidation when switching to tabs with maps
      setTimeout(() => {
        if (targetId === "tabGeo") {
          geoEngine.initMap();
          if (geoEngine.map) geoEngine.map.invalidateSize();
        } else if (targetId === "tabOsint") {
          nominalMapEngine.initMap();
          if (nominalMapEngine.map) nominalMapEngine.map.invalidateSize();
        }
      }, 100);

      window.logCyberEvent("INFO", `Switched to workspace module: ${targetId.toUpperCase()}`);
    });
  });

  // Populate Country Dropdown
  const countrySelect = document.getElementById("countrySelect");
  if (countrySelect && window.PHONE_DATABASE) {
    window.PHONE_DATABASE.countries.forEach(c => {
      const opt = document.createElement("option");
      const dialCode = c.dialCode || c.code;
      opt.value = dialCode;
      opt.textContent = `${c.flag} ${c.name} (+${dialCode})`;
      countrySelect.appendChild(opt);
    });

    countrySelect.addEventListener("change", (e) => {
      const phoneInput = document.getElementById("phoneInput");
      const dial = e.target.value;
      if (phoneInput && dial) {
        // If empty or already has a +, replace the dial code prefix
        const cur = phoneInput.value.trim();
        if (!cur || cur.startsWith("+")) {
          phoneInput.value = `+${dial} `;
        }
        phoneInput.focus();
      }
    });
  }

  // Preset Buttons
  const presetButtons = document.querySelectorAll(".preset-btn");
  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const num = btn.getAttribute("data-num");
      const phoneInput = document.getElementById("phoneInput");
      if (phoneInput && num) {
        phoneInput.value = num;
        runPhoneAnalysis(num);
      }
    });
  });

  // Phone Scan Button
  const analyzeBtn = document.getElementById("analyzePhoneBtn");
  const phoneInput = document.getElementById("phoneInput");
  if (analyzeBtn && phoneInput) {
    analyzeBtn.addEventListener("click", () => {
      runPhoneAnalysis(phoneInput.value);
    });

    phoneInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        runPhoneAnalysis(phoneInput.value);
      }
    });
  }

  // Execute Phone OSINT Analysis
  function runPhoneAnalysis(rawNumber) {
    if (!rawNumber || !rawNumber.trim()) {
      alert("Please enter a phone number to analyze.");
      return;
    }

    window.logCyberEvent("INFO", `Initiating E.164 telecom lookup for: ${rawNumber.trim()}`);
    const results = osintEngine.parseNumber(rawNumber);

    const resultBox = document.getElementById("osintResultBox");
    const emptyBox = document.getElementById("osintEmptyState");
    const errorBox = document.getElementById("osintErrorBox");

    if (!results.success) {
      if (errorBox) {
        errorBox.textContent = results.error;
        errorBox.classList.remove("hidden");
      }
      if (resultBox) resultBox.classList.add("hidden");
      if (emptyBox) emptyBox.classList.add("hidden");
      window.logCyberEvent("WARN", `Lookup failed: ${results.error}`);
      return;
    }

    if (errorBox) errorBox.classList.add("hidden");
    if (emptyBox) emptyBox.classList.add("hidden");
    if (resultBox) resultBox.classList.remove("hidden");

    // Populate UI elements (null-safe guards on each element)
    const _set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    _set("resCountry", `${results.country.flag} ${results.country.name} (${results.country.iso})`);
    _set("resE164", results.e164);
    _set("resRfc", results.rfc3966);
    _set("resNational", results.nationalFormatted || results.nationalNumber || "");
    _set("resDialCode", `+${results.dialCode}`);
    _set("resLineType", results.lineType);
    _set("resCarrier", results.carrier ? results.carrier.name : "Regional MNO");

    // Risk Meter & Badges
    const riskScoreEl = document.getElementById("resRiskScore");
    const riskBarEl = document.getElementById("resRiskBar");
    const riskLevelEl = document.getElementById("resRiskLevel");
    const riskReasonsEl = document.getElementById("riskReasonsList");

    if (riskScoreEl) riskScoreEl.textContent = `${results.riskScore}/100`;
    if (riskBarEl) {
      riskBarEl.style.width = `${results.riskScore}%`;
      riskBarEl.className = `risk-bar-fill risk-${results.riskLevel.toLowerCase()}`;
    }
    if (riskLevelEl) {
      riskLevelEl.textContent = `${results.riskLevel} RISK`;
      riskLevelEl.className = `badge-tag badge-${results.riskLevel.toLowerCase() === 'high' ? 'danger' : results.riskLevel.toLowerCase() === 'medium' ? 'warning' : 'success'}`;
    }

    if (riskReasonsEl) {
      riskReasonsEl.innerHTML = "";
      results.riskReasons.forEach(r => {
        const li = document.createElement("li");
        li.textContent = r;
        riskReasonsEl.appendChild(li);
      });
    }

    // Nominal Map Update
    if (results.nominalCoords) {
      nominalMapEngine.initMap(results.nominalCoords, 5);
      nominalMapEngine.renderOnMap(
        results.nominalCoords[0],
        results.nominalCoords[1],
        25000,
        `Nominal Region: ${results.country.name} (Capital: ${results.country.capital})`
      );
    }

    window.logCyberEvent("SUCCESS", `E.164 verified for ${results.country.name} | Carrier: ${results.carrier ? results.carrier.name : 'Unknown'} | Risk: ${results.riskLevel} (${results.riskScore}/100)`);
    window.logCyberEvent("INFO", `Notice: Exact physical street address is shielded by carrier core network. Showing nominal region center.`);

    // Persist lookup to backend SQLite database
    persistPhoneLookupToDb({
      phoneNumber: results.e164,
      country: results.country.name,
      iso: results.country.iso,
      lineType: results.lineType,
      carrier: results.carrier ? results.carrier.name : "Unknown",
      riskScore: results.riskScore,
      riskLevel: results.riskLevel
    });
  }

  // Persist Phone OSINT record to SQLite DB
  async function persistPhoneLookupToDb(payload) {
    try {
      const res = await fetch("/api/db/osint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.logCyberEvent("SUCCESS", `[DB_COMMIT] Record persisted to SQLite database table: phone_lookups`);
        fetchDbStats();
      }
    } catch (e) {
      console.warn("DB save error:", e);
    }
  }

  // --- Live Geolocation & Address Locator Controller ---
  const acquireGpsBtn = document.getElementById("acquireGpsBtn");
  const acquireIpBtn = document.getElementById("acquireIpBtn");
  const geoResultBox = document.getElementById("geoResultBox");
  const geoStatusAlert = document.getElementById("geoStatusAlert");

  if (acquireGpsBtn) {
    acquireGpsBtn.addEventListener("click", async () => {
      setGeoLoading(true, "Requesting hardware GPS access via W3C Geolocation API...");
      window.logCyberEvent("INFO", "Prompting user for W3C high-accuracy Geolocation permission...");

      try {
        const telemetry = await geoEngine.acquireGpsLocation();
        displayGeoTelemetry(telemetry);
        window.logCyberEvent("SUCCESS", `GPS Lock Acquired! Lat: ${telemetry.coords.latitude}, Lon: ${telemetry.coords.longitude} (±${telemetry.coords.accuracyMeters}m)`);
        window.logCyberEvent("SUCCESS", `Reverse Geocoding resolved physical street address: ${telemetry.address.fullAddress}`);
      } catch (err) {
        showGeoError(err.message);
        window.logCyberEvent("WARN", `GPS acquisition error: ${err.message}`);
      } finally {
        setGeoLoading(false);
      }
    });
  }

  if (acquireIpBtn) {
    acquireIpBtn.addEventListener("click", async () => {
      setGeoLoading(true, "Resolving approximate ISP location via network routing tables...");
      window.logCyberEvent("INFO", "Performing IP-based network geolocation lookup...");

      try {
        const telemetry = await geoEngine.acquireIpLocation();
        displayGeoTelemetry(telemetry);
        window.logCyberEvent("SUCCESS", `IP Routing Location: ${telemetry.address.city}, ${telemetry.address.country} (${telemetry.network.isp})`);
      } catch (err) {
        showGeoError(err.message);
        window.logCyberEvent("WARN", `IP lookup error: ${err.message}`);
      } finally {
        setGeoLoading(false);
      }
    });
  }

  function setGeoLoading(isLoading, text = "") {
    if (acquireGpsBtn) acquireGpsBtn.disabled = isLoading;
    if (acquireIpBtn) acquireIpBtn.disabled = isLoading;
    if (geoStatusAlert) {
      if (isLoading) {
        geoStatusAlert.className = "alert alert-info";
        geoStatusAlert.innerHTML = `<span class="spinner-inline"></span> ${text}`;
        geoStatusAlert.classList.remove("hidden");
      } else {
        geoStatusAlert.classList.add("hidden");
      }
    }
  }

  function showGeoError(errorMsg) {
    if (geoStatusAlert) {
      geoStatusAlert.className = "alert alert-danger";
      geoStatusAlert.innerHTML = `⚠️ <strong>Acquisition Failed:</strong> ${errorMsg}`;
      geoStatusAlert.classList.remove("hidden");
    }
  }

  function displayGeoTelemetry(t) {
    if (!geoResultBox) return;
    geoResultBox.classList.remove("hidden");

    // Timestamp fields
    document.getElementById("geoUtcTime").textContent = t.timestamp.utc;
    document.getElementById("geoLocalTime").textContent = `${t.timestamp.local} (${t.timestamp.timezone})`;
    document.getElementById("geoEpochTime").textContent = `${t.timestamp.epoch} ms`;
    document.getElementById("geoIsoTime").textContent = t.timestamp.iso;

    // Coordinates
    document.getElementById("geoLat").textContent = `${t.coords.latitude}°`;
    document.getElementById("geoLon").textContent = `${t.coords.longitude}°`;
    document.getElementById("geoAccuracy").textContent = `± ${t.coords.accuracyMeters} meters`;
    document.getElementById("geoAltitude").textContent = t.coords.altitude || "Sea Level / Unreported";
    document.getElementById("geoSpeed").textContent = t.coords.speed || "0 km/h";

    // Physical Address
    document.getElementById("geoStreet").textContent = t.address.street || "Unmapped street";
    document.getElementById("geoCity").textContent = t.address.city || "Urban Area";
    document.getElementById("geoState").textContent = t.address.state || "N/A";
    document.getElementById("geoPostal").textContent = t.address.postalCode || "N/A";
    document.getElementById("geoCountry").textContent = `${t.address.country} (${t.address.countryCode || ""})`;
    document.getElementById("geoFullAddress").textContent = t.address.fullAddress;
    document.getElementById("geoSourceBadge").textContent = t.source;

    // Device Fingerprint
    if (t.device) {
      document.getElementById("geoDevicePlatform").textContent = t.device.platform;
      document.getElementById("geoDeviceScreen").textContent = t.device.screenResolution;
      document.getElementById("geoDeviceCores").textContent = t.device.hardwareConcurrency;
      document.getElementById("geoDeviceNet").textContent = t.device.connection;
    }

    // Persist to backend database
    persistTelemetryToDb({
      source: t.source,
      timestampIso: t.timestamp.iso,
      latitude: t.coords.latitude,
      longitude: t.coords.longitude,
      accuracyMeters: t.coords.accuracyMeters,
      fullAddress: t.address.fullAddress,
      city: t.address.city,
      country: t.address.country,
      devicePlatform: t.device ? t.device.platform : "Unknown"
    });
  }

  // Persist Location Telemetry to SQLite DB
  async function persistTelemetryToDb(payload) {
    try {
      const res = await fetch("/api/db/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.logCyberEvent("SUCCESS", `[DB_COMMIT] Live geolocation & address saved to SQLite table: telemetry_logs`);
        fetchDbStats();
      }
    } catch (e) {
      console.warn("DB telemetry save error:", e);
    }
  }

  // Export JSON Telemetry Button
  const copyJsonBtn = document.getElementById("copyTelemetryJsonBtn");
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener("click", () => {
      if (!geoEngine.currentTelemetry) {
        alert("No active location telemetry to copy. Please acquire location first.");
        return;
      }
      const jsonStr = JSON.stringify(geoEngine.currentTelemetry, null, 2);
      navigator.clipboard.writeText(jsonStr).then(() => {
        copyJsonBtn.textContent = "✓ Copied to Clipboard!";
        setTimeout(() => { copyJsonBtn.textContent = "📋 Copy JSON Telemetry"; }, 2000);
        window.logCyberEvent("INFO", "Telemetry JSON payload copied to clipboard.");
      });
    });
  }

  // Download GeoJSON Button
  const downloadGeoJsonBtn = document.getElementById("downloadGeoJsonBtn");
  if (downloadGeoJsonBtn) {
    downloadGeoJsonBtn.addEventListener("click", () => {
      const geoJson = geoEngine.exportGeoJson();
      if (!geoJson) {
        alert("No active location telemetry to export. Please acquire location first.");
        return;
      }
      const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: "application/geo+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybertrace_telemetry_${Date.now()}.geojson`;
      a.click();
      URL.revokeObjectURL(url);
      window.logCyberEvent("SUCCESS", "Exported location telemetry as GeoJSON standard format.");
    });
  }

  // Clear Terminal Button
  const clearTerminalBtn = document.getElementById("clearTerminalBtn");
  if (clearTerminalBtn) {
    clearTerminalBtn.addEventListener("click", () => {
      const logContainer = document.getElementById("terminalOutput");
      if (logContainer) logContainer.innerHTML = "";
      window.logCyberEvent("INFO", "Audit terminal buffer flushed.");
    });
  }

  // Export Forensic Summary Report
  const exportReportBtn = document.getElementById("exportReportBtn");
  if (exportReportBtn) {
    exportReportBtn.addEventListener("click", () => {
      const logsText = terminalLogs.map(l => `[${l.fullTime}] [${l.level}] ${l.message}`).join("\n");
      const report = `===============================================================
CYBERTRACE // TELECOM INTELLIGENCE & GEOLOCATION AUDIT REPORT
Generated At: ${new Date().toISOString()}
Session ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
===============================================================

[1] CURRENT GEOLOCATION TELEMETRY
${geoEngine.currentTelemetry ? JSON.stringify(geoEngine.currentTelemetry, null, 2) : "No live GPS acquired in this session."}

[2] TERMINAL AUDIT LOG TRAIL
${logsText || "No logs recorded."}

[3] TELECOM PRIVACY VERIFICATION
- Standard phone numbers do not expose live GPS or physical street address.
- Cell tower location is confined to MNO Core Network (EPC/5GC).
- Valid location acquisition requires W3C client consent or lawful warrant.
===============================================================`;

      const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybertrace_forensic_audit_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      window.logCyberEvent("SUCCESS", "Forensic summary audit report downloaded.");
    });
  }

  // Fetch Database Metrics
  async function fetchDbStats() {
    try {
      const res = await fetch("/api/db/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          const s = data.stats;
          const lookupEl = document.getElementById("dbLookupCount");
          const telemetryEl = document.getElementById("dbTelemetryCount");
          const engineTypeEl = document.getElementById("dbEngineType");
          const badgeEl = document.getElementById("dbEngineBadge");

          if (lookupEl) lookupEl.textContent = s.phoneLookupCount;
          if (telemetryEl) telemetryEl.textContent = s.telemetryLogCount;
          if (engineTypeEl) engineTypeEl.textContent = s.mode === 'sqlite' ? 'SQLite (node:sqlite)' : 'JSON Store (Fallback)';
          if (badgeEl) {
            badgeEl.textContent = s.mode === 'sqlite' ? 'SQLITE CONNECTED' : 'JSON DB CONNECTED';
            badgeEl.className = 'badge-tag badge-success';
          }
        }
      }
    } catch (e) {
      console.warn("Fetch DB stats error:", e);
    }
  }

  // Database Action Buttons
  const refreshDbBtn = document.getElementById("refreshDbBtn");
  if (refreshDbBtn) {
    refreshDbBtn.addEventListener("click", () => {
      fetchDbStats();
      window.logCyberEvent("INFO", "Database metrics refreshed from server.");
    });
  }

  const clearDbBtn = document.getElementById("clearDbBtn");
  if (clearDbBtn) {
    clearDbBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to clear all stored database records?")) return;
      try {
        const res = await fetch("/api/db/clear", { method: "DELETE" });
        if (res.ok) {
          fetchDbStats();
          window.logCyberEvent("WARN", "[DB_TRUNCATE] All stored database records cleared.");
        }
      } catch (e) {
        console.warn("Clear DB error:", e);
      }
    });
  }

  // Initial fetch of DB stats
  fetchDbStats();

  // Initial Welcome Event
  window.logCyberEvent("INFO", "CyberTrace Core System initialized. Ready for telecom intelligence & authorized geolocation analysis.");
});

