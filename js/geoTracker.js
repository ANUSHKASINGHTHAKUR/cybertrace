// CyberTrace Authorized Geolocation & Reverse Geocoding Engine
class GeoTrackerEngine {
  constructor(mapContainerId) {
    this.mapContainerId = mapContainerId;
    this.map = null;
    this.marker = null;
    this.accuracyCircle = null;
    this.currentTelemetry = null;
  }

  // Initialize or reset Leaflet map
  initMap(defaultCoords = [28.6139, 77.2090], defaultZoom = 5) {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    const container = document.getElementById(this.mapContainerId);
    if (!container) return;

    if (typeof L === 'undefined') {
      console.warn(`[CyberTrace] Leaflet library not yet ready for container #${this.mapContainerId}`);
      return;
    }

    // Create Leaflet map instance
    this.map = L.map(this.mapContainerId, {
      center: defaultCoords,
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: false
    });

    // High-tech dark CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    // Custom attribution badge
    L.control.attribution({ position: 'bottomright', prefix: 'CyberTrace GeoEngine | OSM & CartoDB' }).addTo(this.map);
  }

  // Request high-precision GPS location from browser
  async acquireGpsLocation() {
    if (!navigator.geolocation) {
      throw new Error("Geolocation API is not supported by your browser or environment.");
    }

    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const telemetry = await this.processPosition(position, "GPS / Hardware Sensor (Authorized)");
            resolve(telemetry);
          } catch (err) {
            reject(err);
          }
        },
        (err) => {
          let msg = "Location request failed.";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              msg = "User denied Geolocation permission. Use the IP Fallback button to view approximate network location.";
              break;
            case err.POSITION_UNAVAILABLE:
              msg = "Device location unavailable. Ensure GPS or WiFi is enabled.";
              break;
            case err.TIMEOUT:
              msg = "GPS acquisition timed out. Trying with standard accuracy...";
              break;
          }
          reject(new Error(msg));
        },
        options
      );
    });
  }

  // IP Geolocation fallback if GPS denied
  async acquireIpLocation() {
    try {
      const response = await fetch("https://ipwho.is/");
      if (!response.ok) throw new Error("IP Geolocation service unavailable");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to resolve IP location");
      }

      const now = new Date();
      const telemetry = {
        source: "IP / ISP Routing Network (Fallback)",
        timestamp: {
          epoch: now.getTime(),
          iso: now.toISOString(),
          local: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
          utc: now.toUTCString(),
          timezone: data.timezone ? data.timezone.id : Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        coords: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: 5000, // IP accuracy is typically 2-10km
          altitude: null,
          heading: null,
          speed: null
        },
        address: {
          fullAddress: `${data.city}, ${data.region}, ${data.country}`,
          street: "N/A (ISP Autonomous System Point)",
          neighbourhood: data.city,
          city: data.city,
          state: data.region,
          postalCode: data.postal,
          country: data.country,
          countryCode: data.country_code
        },
        network: {
          ip: data.ip,
          isp: data.connection ? data.connection.isp : "Unknown ISP",
          asn: data.connection ? `AS${data.connection.asn} (${data.connection.org})` : "N/A"
        }
      };

      this.currentTelemetry = telemetry;
      this.renderOnMap(telemetry.coords.latitude, telemetry.coords.longitude, 5000, telemetry.address.fullAddress);
      return telemetry;
    } catch (err) {
      throw new Error("IP Geolocation request failed: " + err.message);
    }
  }

  // Process raw W3C Geolocation position and reverse-geocode to address
  async processPosition(pos, sourceLabel) {
    const coords = pos.coords;
    const timestampMs = pos.timestamp || Date.now();
    const dateObj = new Date(timestampMs);

    // Reverse geocode to exact physical street address
    let addressData = await this.reverseGeocode(coords.latitude, coords.longitude);

    const telemetry = {
      source: sourceLabel,
      timestamp: {
        epoch: timestampMs,
        iso: dateObj.toISOString(),
        local: dateObj.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
        dateFormatted: dateObj.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
        utc: dateObj.toUTCString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      coords: {
        latitude: parseFloat(coords.latitude.toFixed(6)),
        longitude: parseFloat(coords.longitude.toFixed(6)),
        accuracyMeters: Math.round(coords.accuracy || 10),
        altitude: coords.altitude !== null ? `${Math.round(coords.altitude)} m` : "N/A",
        altitudeAccuracy: coords.altitudeAccuracy !== null ? `±${Math.round(coords.altitudeAccuracy)} m` : "N/A",
        heading: coords.heading !== null && !isNaN(coords.heading) ? `${Math.round(coords.heading)}°` : "Stationary",
        speed: coords.speed !== null && !isNaN(coords.speed) ? `${(coords.speed * 3.6).toFixed(1)} km/h` : "0 km/h"
      },
      address: addressData,
      device: this.getDeviceFingerprint()
    };

    this.currentTelemetry = telemetry;
    this.renderOnMap(telemetry.coords.latitude, telemetry.coords.longitude, telemetry.coords.accuracyMeters, telemetry.address.fullAddress);
    return telemetry;
  }

  // Reverse geocode using OpenStreetMap Nominatim with local fallback
  async reverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const street = addr.road || addr.pedestrian || addr.suburb || "Street level unmapped";
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || "";
        const city = addr.city || addr.town || addr.village || addr.municipality || "Urban Area";
        const state = addr.state || addr.province || addr.region || "";
        const postalCode = addr.postcode || "";
        const country = addr.country || "";
        const countryCode = (addr.country_code || "").toUpperCase();

        return {
          fullAddress: data.display_name || `${street}, ${city}, ${country}`,
          street,
          neighbourhood,
          city,
          state,
          postalCode,
          country,
          countryCode
        };
      }
    } catch (e) {
      console.warn("Nominatim reverse geocode error:", e);
    }

    // Fallback if network blocked or rate limited
    return {
      fullAddress: `Coordinates: ${lat.toFixed(4)}°, ${lon.toFixed(4)}° (Reverse lookup rate-limited)`,
      street: "Coordinates-based pin",
      neighbourhood: "N/A",
      city: "Detected Coordinates",
      state: "N/A",
      postalCode: "N/A",
      country: "N/A",
      countryCode: "N/A"
    };
  }

  // Update map marker, accuracy circle, and view
  renderOnMap(lat, lon, accuracy, addressLabel) {
    if (!this.map) {
      this.initMap([lat, lon], 16);
    }
    
    if (!this.map || typeof L === 'undefined') {
      console.warn("[CyberTrace] Map instance unavailable for rendering.");
      return;
    }

    this.map.invalidateSize();

    // Clear previous markers
    if (this.marker) this.map.removeLayer(this.marker);
    if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);

    // Custom pulsing cyber marker icon
    const cyberIcon = L.divIcon({
      className: 'cyber-map-pin',
      html: `
        <div class="pin-ring"></div>
        <div class="pin-pulse"></div>
        <div class="pin-core"></div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.marker = L.marker([lat, lon], { icon: cyberIcon }).addTo(this.map);
    
    // Accuracy Circle
    const radius = Math.max(accuracy, 15);
    this.accuracyCircle = L.circle([lat, lon], {
      radius: radius,
      color: '#00f2fe',
      fillColor: '#00f2fe',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '4, 6'
    }).addTo(this.map);

    this.marker.bindPopup(`
      <div class="map-popup-card">
        <div class="popup-badge">GPS VERIFIED // AUTHENTICATED</div>
        <div class="popup-address">${addressLabel}</div>
        <div class="popup-coords">${lat.toFixed(6)}°, ${lon.toFixed(6)}°</div>
        <div class="popup-accuracy">Accuracy: ±${accuracy}m</div>
      </div>
    `).openPopup();

    this.map.flyTo([lat, lon], 16, { animate: true, duration: 1.2 });
  }

  // Telemetry device fingerprint details
  getDeviceFingerprint() {
    const nav = window.navigator;
    return {
      userAgent: nav.userAgent,
      platform: nav.platform || "Desktop/Mobile",
      language: nav.language,
      screenResolution: `${window.screen.width}x${window.screen.height} (${window.screen.colorDepth}-bit)`,
      hardwareConcurrency: `${nav.hardwareConcurrency || "N/A"} CPU Cores`,
      deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB RAM` : "N/A",
      connection: nav.connection ? `${nav.connection.effectiveType || "N/A"} (Downlink: ${nav.connection.downlink || "N/A"} Mbps)` : "Broadband / WiFi"
    };
  }

  // Export data as JSON or GeoJSON
  exportGeoJson() {
    if (!this.currentTelemetry) return null;
    const t = this.currentTelemetry;
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [t.coords.longitude, t.coords.latitude]
          },
          properties: {
            timestamp_iso: t.timestamp.iso,
            timestamp_epoch: t.timestamp.epoch,
            accuracy_meters: t.coords.accuracyMeters,
            full_address: t.address.fullAddress,
            city: t.address.city,
            country: t.address.country,
            source: t.source
          }
        }
      ]
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeoTrackerEngine;
}
