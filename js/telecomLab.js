// CyberTrace Telecom Privacy & Network Architecture Visualizer
class TelecomLab {
  constructor(containerId) {
    this.containerId = containerId;
    this.activeStep = 0;
    this.triangulationActive = false;
  }

  init() {
    this.renderCellTowerSimulation();
    this.renderSs7AttackSimulation();
  }

  // Visual Cell Tower Triangulation Simulator
  renderCellTowerSimulation() {
    const container = document.getElementById("cellTowerSimulator");
    if (!container) return;

    container.innerHTML = `
      <div class="telecom-diagram-box">
        <div class="diagram-header">
          <div class="diagram-title">
            <span class="pulse-icon"></span>
            CELLULAR CORE NETWORK // MULTILATERATION & TDOA
          </div>
          <button id="toggleTriangulateBtn" class="btn btn-outline-cyan btn-sm">
            <span class="btn-icon">⚡</span> Run Triangulation Scan
          </button>
        </div>

        <div class="simulation-canvas-wrapper">
          <svg id="towerSvg" viewBox="0 0 700 360" class="telecom-svg">
            <defs>
              <radialGradient id="towerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#00f2fe" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Background Grid -->
            <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#gridPattern)"/>

            <!-- Cell Tower Alpha -->
            <g class="tower-group" id="towerA" transform="translate(140, 90)">
              <circle class="tower-pulse" r="70" fill="rgba(0,242,254,0.06)" stroke="#00f2fe" stroke-dasharray="3,3"/>
              <circle class="tower-node" r="16" fill="#0f172a" stroke="#00f2fe" stroke-width="2"/>
              <text x="0" y="5" text-anchor="middle" fill="#00f2fe" font-size="12" font-family="monospace">🗼 A</text>
              <text x="0" y="32" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace">eNodeB #01</text>
              <text x="0" y="44" text-anchor="middle" fill="#64748b" font-size="9" font-family="monospace">RSSI: -72 dBm</text>
            </g>

            <!-- Cell Tower Beta -->
            <g class="tower-group" id="towerB" transform="translate(540, 110)">
              <circle class="tower-pulse" r="85" fill="rgba(0,242,254,0.06)" stroke="#00f2fe" stroke-dasharray="3,3"/>
              <circle class="tower-node" r="16" fill="#0f172a" stroke="#00f2fe" stroke-width="2"/>
              <text x="0" y="5" text-anchor="middle" fill="#00f2fe" font-size="12" font-family="monospace">🗼 B</text>
              <text x="0" y="32" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace">eNodeB #02</text>
              <text x="0" y="44" text-anchor="middle" fill="#64748b" font-size="9" font-family="monospace">RSSI: -84 dBm</text>
            </g>

            <!-- Cell Tower Gamma -->
            <g class="tower-group" id="towerC" transform="translate(320, 270)">
              <circle class="tower-pulse" r="60" fill="rgba(0,242,254,0.06)" stroke="#00f2fe" stroke-dasharray="3,3"/>
              <circle class="tower-node" r="16" fill="#0f172a" stroke="#00f2fe" stroke-width="2"/>
              <text x="0" y="5" text-anchor="middle" fill="#00f2fe" font-size="12" font-family="monospace">🗼 C</text>
              <text x="0" y="32" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace">eNodeB #03</text>
              <text x="0" y="44" text-anchor="middle" fill="#64748b" font-size="9" font-family="monospace">RSSI: -68 dBm</text>
            </g>

            <!-- Target Mobile Device -->
            <g class="device-target" id="mobileTarget" transform="translate(320, 140)">
              <!-- Signal lines to towers -->
              <line id="beamA" x1="0" y1="0" x2="-180" y2="-50" stroke="#00f2fe" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.3"/>
              <line id="beamB" x1="0" y1="0" x2="220" y2="-30" stroke="#00f2fe" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.3"/>
              <line id="beamC" x1="0" y1="0" x2="0" y2="130" stroke="#00f2fe" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.3"/>

              <!-- Triangulation Intersect Area -->
              <circle id="triangArea" r="28" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2,2"/>
              <circle r="12" fill="#10b981" fill-opacity="0.9"/>
              <text x="0" y="4" text-anchor="middle" fill="#0f172a" font-weight="bold" font-size="10">📱</text>
              <text x="0" y="-18" text-anchor="middle" fill="#10b981" font-size="11" font-family="monospace" font-weight="600">Subscriber UE</text>
              <text x="0" y="24" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="monospace">TDOA Confidence: ±350m</text>
            </g>
          </svg>
        </div>

        <div class="telecom-architecture-cards">
          <div class="arch-card">
            <div class="arch-badge">BASE TRANSCEIVER (RAN)</div>
            <h4>Radio Access Network</h4>
            <p>Your handset communicates with towers using timing advance (TA) and signal attenuation. Exact sector coordinates stay strictly between the phone and the serving base station.</p>
          </div>
          <div class="arch-card">
            <div class="arch-badge">CARRIER CORE (EPC / 5GC)</div>
            <h4>MME / AMF Core Isolation</h4>
            <p>Location data is held inside Mobility Management Entities (MME) for routing active voice/data packets. It is entirely air-gapped from arbitrary internet queries.</p>
          </div>
          <div class="arch-card">
            <div class="arch-badge">LEGAL FIREWALL</div>
            <h4>Lawful Intercept (LI) Gateways</h4>
            <p>Access requires CALEA/ETSI compliant Lawful Intercept interfaces requiring cryptographic authentication and formal judicial warrants.</p>
          </div>
        </div>
      </div>
    `;

    const btn = document.getElementById("toggleTriangulateBtn");
    if (btn) {
      btn.addEventListener("click", () => this.triggerTriangulationAnim());
    }
  }

  // Trigger high-tech scan animation on SVG
  triggerTriangulationAnim() {
    const beams = ["beamA", "beamB", "beamC"];
    const area = document.getElementById("triangArea");
    
    beams.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = "1";
        el.style.stroke = "#10b981";
        el.style.strokeWidth = "2.5";
      }
    });

    if (area) {
      area.setAttribute("r", "15");
      area.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    }

    if (window.logCyberEvent) {
      window.logCyberEvent("INFO", "TDOA Multilateration simulated across eNodeB nodes. Position resolved within cellular sector.");
    }

    setTimeout(() => {
      beams.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.opacity = "0.3";
          el.style.stroke = "#00f2fe";
          el.style.strokeWidth = "1.5";
        }
      });
      if (area) {
        area.setAttribute("r", "28");
      }
    }, 2500);
  }

  // SS7 Protocol Exploitation vs Modern Defense Diagram
  renderSs7AttackSimulation() {
    const container = document.getElementById("ss7Simulator");
    if (!container) return;

    container.innerHTML = `
      <div class="telecom-diagram-box">
        <div class="diagram-header">
          <div class="diagram-title">
            <span class="pulse-icon pulse-amber"></span>
            SS7 / DIAMETER SIGNALING EXPLOIT MECHANISM vs 5G ZERO TRUST
          </div>
          <div class="pill pill-warning">HISTORICAL VULNERABILITY ARCHITECTURE</div>
        </div>

        <div class="ss7-flow-grid">
          <!-- Step 1 -->
          <div class="flow-step-card">
            <div class="step-num">01</div>
            <h4>Legacy SS7 Threat (2G/3G)</h4>
            <p>In older SS7 networks, rogue entities with roaming access sent <code>SendRoutingInfoForSM</code> or <code>AnyTimeInterrogation (ATI)</code> messages to target HLRs to leak serving cell IDs.</p>
            <div class="flow-tag tag-threat">Threat: Global Tracking</div>
          </div>

          <!-- Step 2 -->
          <div class="flow-step-card">
            <div class="step-num">02</div>
            <h4>Signaling Firewalls (4G LTE)</h4>
            <p>Carriers deployed SS7/Diameter signaling firewalls at border interconnects (STP/DRA) that block unsolicited location queries from external untrusted partner networks.</p>
            <div class="flow-tag tag-mitigation">Mitigation: Boundary Filtering</div>
          </div>

          <!-- Step 3 -->
          <div class="flow-step-card">
            <div class="step-num">03</div>
            <h4>5G Standalone Privacy (SUCI)</h4>
            <p>5G eliminates plain-text IMSI over the air. Handsets encrypt their subscriber identity using the carrier's public key (Subscription Concealed Identifier - SUCI), neutralizing IMSI catchers (Stingrays).</p>
            <div class="flow-tag tag-secure">Defense: Public Key Cryptography</div>
          </div>
        </div>

        <!-- Myth vs Reality Table -->
        <div class="myth-table-wrapper">
          <table class="cyber-table">
            <thead>
              <tr>
                <th>Tracking Concept</th>
                <th>Public "Phone Tracker" Sites Claim</th>
                <th>Cybersecurity Technical Reality</th>
                <th>Security Classification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Enter Number &rarr; Live GPS Pin</strong></td>
                <td><span class="text-danger">❌ "Instant Satellite GPS Coordinates"</span></td>
                <td>Impossible. Web browsers cannot issue SS7/Diameter commands or access carrier EPC. These sites are ad-revenue or phishing traps.</td>
                <td><span class="badge-tag badge-danger">FRAUD / CLICKBAIT</span></td>
              </tr>
              <tr>
                <td><strong>Browser Geolocation API</strong></td>
                <td><span class="text-warning">⚠️ Requires Explicit User Consent</span></td>
                <td>High-precision hardware GPS + WiFi BSSID scanning via W3C <code>navigator.geolocation</code>. Requires active permission modal.</td>
                <td><span class="badge-tag badge-success">AUTHENTICATED CLIENT API</span></td>
              </tr>
              <tr>
                <td><strong>Telecom Core Triangulation</strong></td>
                <td><span class="text-cyan">🔒 Lawful Intercept Only</span></td>
                <td>MNO core uses TDOA, RSSI, and beamforming on internal eNodeB/gNodeB. Requires judicial warrant or carrier NOC engineer access.</td>
                <td><span class="badge-tag badge-cyan">TELECOM AIR-GAPPED</span></td>
              </tr>
              <tr>
                <td><strong>Phone Number OSINT</strong></td>
                <td><span class="text-cyan">ℹ️ Country, Carrier & Risk Rating</span></td>
                <td>E.164 parsing, ITU National Significant Number checks, and VoIP reputation lookups. Reveals operator & region, never live GPS.</td>
                <td><span class="badge-tag badge-info">LEGITIMATE OSINT</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelecomLab;
}
