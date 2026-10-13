# CyberTrace // Telecom Intelligence & Geolocation Security Portal

An advanced cybersecurity and telecommunications intelligence web application designed to demonstrate and analyze:
1. **Phone Number OSINT & Carrier Threat Profiling**
2. **Authorized Real-Time GPS Telemetry & Physical Address Resolution**
3. **Telecom Privacy, Cell Tower Multilateration & SS7/5G Security Architecture**
4. **Digital Forensics Audit Logging & Incident Reporting**

---

## 🚀 Key Features

### 1. Phone Intelligence & Carrier OSINT (Tab 01)
* **ITU-T E.164 Analysis:** Validates international dialing prefixes, RFC 3966 URIs, and national number formatting masks.
* **Carrier & Line Classification:** Detects mobile cellular operators, fixed-lines, toll-free lines, and virtual VoIP blocks (e.g. Twilio, Bandwidth, Google Voice).
* **Spoofing & Fraud Risk Meter:** Evaluates telephone numbers on a 0–100 risk scale, flagging high-risk disposable VoIP numbers, premium rate numbers, and Wangiri scam origins.
* **Nominal Regional Mapping:** Automatically plots the nominal geographic region on an interactive dark Leaflet map, explaining the boundaries of public telecom data.

### 2. Live GPS & Physical Address Locator (Tab 02)
* **High-Accuracy Sensor Grasp:** Uses the W3C Geolocation API (`enableHighAccuracy: true`) with client authorization.
* **Precision Timestamps:** Simultaneously captures:
  * Coordinated Universal Time (UTC)
  * Human Local Time with milliseconds
  * Unix Epoch Time (milliseconds)
  * ISO-8601 standardized format
* **Reverse Geocoding:** Converts raw latitude and longitude coordinates into human-readable physical street addresses (Street, Neighborhood, City, State, Postal Code, Country) powered by OpenStreetMap Nominatim.
* **Interactive Map:** Renders a CartoDB Dark Matter map with a pulsing cyber radar marker and uncertainty radius circle.
* **Data Exporter:** Download telemetry logs as standardized GeoJSON or copy raw JSON payloads to clipboard.
* **IP Fallback:** Includes an IP-based network routing fallback for environments where hardware GPS is restricted or declined.

### 3. Telecom Privacy & Signaling Security Lab (Tab 03)
* **Cell Tower Triangulation Visualizer:** Interactive SVG simulation demonstrating Time Difference of Arrival (TDOA) and Received Signal Strength Indicator (RSSI) across cellular base stations (eNodeB/gNodeB).
* **EPC/5GC Core Isolation Explanation:** Illustrates why cell tower telemetry is air-gapped from the public internet inside Mobility Management Entities (MME) and Access Management Functions (AMF).
* **SS7/Diameter vs 5G SUCI Defense:** Explains the historical mechanism of legacy 2G/3G signaling attacks (`SendRoutingInfoForSM`, `AnyTimeInterrogation`) and how modern 5G Subscription Concealed Identifiers (SUCI) cryptographically protect subscriber privacy against IMSI catchers (Stingrays).
* **Myth vs. Reality Matrix:** Formally contrasts fraudulent "instant phone tracker" websites with legitimate client-side APIs and carrier-grade lawful intercept systems.

### 4. Forensics Audit Terminal (Tab 04)
* **Live Streaming Console:** Real-time log buffer recording every lookup, geolocation acquisition, and telecom verification checkpoint.
* **Forensic Report Export:** Generates and downloads a complete `.txt` forensic dossier complete with timestamps, telemetry, and audit trails.

---

## 🛠️ Technology Stack
* **Markup:** Semantic HTML5
* **Styling:** Custom Vanilla CSS with Cyberpunk / Fintech Glassmorphism Design System
* **Logic:** Vanilla ES6+ JavaScript (Object-Oriented modular engines)
* **Mapping:** Leaflet.js & CartoDB Dark Matter tiles
* **Geocoding:** OpenStreetMap Nominatim API
* **Local Server:** Zero-dependency Node.js HTTP server (`server.js`)

---

## ⚡ How to Run Locally

You can launch the server using Node.js:

```bash
# Start the local development server
node server.js
```

Then open your browser at:
```
http://localhost:3000
```

Alternatively, open `index.html` directly in any modern web browser.
