// CyberTrace Database Layer (SQLite with JSON Fallback)
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'cybertrace.db');
const JSON_FILE = path.join(DATA_DIR, 'cybertrace_backup.json');

let dbMode = "none";
let sqliteDb = null;

// Initialize Database
try {
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(DB_FILE);
  dbMode = "sqlite";

  // Create tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS phone_lookups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      country TEXT,
      iso TEXT,
      line_type TEXT,
      carrier TEXT,
      risk_score INTEGER,
      risk_level TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telemetry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      timestamp_iso TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      accuracy_meters REAL,
      full_address TEXT,
      city TEXT,
      country TEXT,
      device_platform TEXT,
      created_at TEXT NOT NULL
    );
  `);

  console.log(`[CyberTrace DB] Initialized SQLite Database at: ${DB_FILE}`);
} catch (err) {
  dbMode = "json";
  console.warn(`[CyberTrace DB] Using JSON persistent database fallback: ${err.message}`);
  if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, JSON.stringify({ phone_lookups: [], telemetry_logs: [] }, null, 2));
  }
}

// Database helper functions
const dbService = {
  getMode() {
    return dbMode;
  },

  getDbFilePath() {
    return dbMode === "sqlite" ? DB_FILE : JSON_FILE;
  },

  // Save phone scan
  savePhoneLookup(data) {
    const createdAt = new Date().toISOString();
    if (dbMode === "sqlite") {
      const stmt = sqliteDb.prepare(`
        INSERT INTO phone_lookups (phone_number, country, iso, line_type, carrier, risk_score, risk_level, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        data.phoneNumber || "",
        data.country || "",
        data.iso || "",
        data.lineType || "",
        data.carrier || "",
        data.riskScore || 0,
        data.riskLevel || "LOW",
        createdAt
      );
      return { success: true, created_at: createdAt };
    } else {
      const raw = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
      const record = { id: Date.now(), ...data, created_at: createdAt };
      raw.phone_lookups.unshift(record);
      fs.writeFileSync(JSON_FILE, JSON.stringify(raw, null, 2));
      return { success: true, record };
    }
  },

  // Get recent phone scans
  getPhoneLookups(limit = 25) {
    if (dbMode === "sqlite") {
      const stmt = sqliteDb.prepare(`
        SELECT * FROM phone_lookups ORDER BY id DESC LIMIT ?
      `);
      return stmt.all(limit);
    } else {
      const raw = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
      return (raw.phone_lookups || []).slice(0, limit);
    }
  },

  // Save location telemetry
  saveTelemetry(data) {
    const createdAt = new Date().toISOString();
    if (dbMode === "sqlite") {
      const stmt = sqliteDb.prepare(`
        INSERT INTO telemetry_logs (source, timestamp_iso, latitude, longitude, accuracy_meters, full_address, city, country, device_platform, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        data.source || "GPS",
        data.timestampIso || createdAt,
        data.latitude || 0,
        data.longitude || 0,
        data.accuracyMeters || 0,
        data.fullAddress || "",
        data.city || "",
        data.country || "",
        data.devicePlatform || "",
        createdAt
      );
      return { success: true, created_at: createdAt };
    } else {
      const raw = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
      const record = { id: Date.now(), ...data, created_at: createdAt };
      raw.telemetry_logs.unshift(record);
      fs.writeFileSync(JSON_FILE, JSON.stringify(raw, null, 2));
      return { success: true, record };
    }
  },

  // Get recent telemetry logs
  getTelemetry(limit = 25) {
    if (dbMode === "sqlite") {
      const stmt = sqliteDb.prepare(`
        SELECT * FROM telemetry_logs ORDER BY id DESC LIMIT ?
      `);
      return stmt.all(limit);
    } else {
      const raw = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
      return (raw.telemetry_logs || []).slice(0, limit);
    }
  },

  // Database stats
  getStats() {
    let lookupCount = 0;
    let telemetryCount = 0;
    if (dbMode === "sqlite") {
      const r1 = sqliteDb.prepare(`SELECT COUNT(*) as count FROM phone_lookups`).get();
      const r2 = sqliteDb.prepare(`SELECT COUNT(*) as count FROM telemetry_logs`).get();
      lookupCount = r1 ? r1.count : 0;
      telemetryCount = r2 ? r2.count : 0;
    } else {
      const raw = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
      lookupCount = (raw.phone_lookups || []).length;
      telemetryCount = (raw.telemetry_logs || []).length;
    }

    let fileSize = 0;
    const targetFile = this.getDbFilePath();
    if (fs.existsSync(targetFile)) {
      fileSize = fs.statSync(targetFile).size;
    }

    return {
      mode: dbMode,
      filePath: targetFile,
      fileSizeBytes: fileSize,
      phoneLookupCount: lookupCount,
      telemetryLogCount: telemetryCount
    };
  },

  // Clear logs
  clearLogs() {
    if (dbMode === "sqlite") {
      sqliteDb.exec(`DELETE FROM phone_lookups; DELETE FROM telemetry_logs;`);
    } else {
      fs.writeFileSync(JSON_FILE, JSON.stringify({ phone_lookups: [], telemetry_logs: [] }, null, 2));
    }
    return { success: true };
  }
};

module.exports = dbService;
