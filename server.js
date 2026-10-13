const http = require('http');
const fs = require('fs');
const path = require('path');
const dbService = require('./db');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Helper: Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const reqPath = decodeURI(urlParts[0]);

  // REST API Endpoints
  if (reqPath.startsWith('/api/db/')) {
    try {
      // 1. Database Stats
      if (req.method === 'GET' && reqPath === '/api/db/stats') {
        const stats = dbService.getStats();
        return sendJson(res, 200, { success: true, stats });
      }

      // 2. Save Phone OSINT Lookup
      if (req.method === 'POST' && reqPath === '/api/db/osint') {
        const payload = await parseBody(req);
        const result = dbService.savePhoneLookup(payload);
        return sendJson(res, 201, result);
      }

      // 3. Get Phone OSINT Lookups
      if (req.method === 'GET' && reqPath === '/api/db/osint') {
        const records = dbService.getPhoneLookups(30);
        return sendJson(res, 200, { success: true, records });
      }

      // 4. Save Location Telemetry
      if (req.method === 'POST' && reqPath === '/api/db/telemetry') {
        const payload = await parseBody(req);
        const result = dbService.saveTelemetry(payload);
        return sendJson(res, 201, result);
      }

      // 5. Get Location Telemetry
      if (req.method === 'GET' && reqPath === '/api/db/telemetry') {
        const records = dbService.getTelemetry(30);
        return sendJson(res, 200, { success: true, records });
      }

      // 6. Clear Database
      if (req.method === 'DELETE' && reqPath === '/api/db/clear') {
        const result = dbService.clearLogs();
        return sendJson(res, 200, result);
      }

      return sendJson(res, 404, { error: 'Unknown API endpoint' });
    } catch (err) {
      console.error('[API Error]:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Static File Serving
  let staticPath = reqPath;
  if (staticPath === '/' || staticPath === '') {
    staticPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, staticPath);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function listenOnPort(port) {
  server.listen(port, () => {
    console.log(`\n===============================================================`);
    console.log(`📡 [CyberTrace Server] ONLINE & LISTENING`);
    console.log(`🌐 [URL] http://localhost:${port}`);
    console.log(`🗄️  [Database] Engine: ${dbService.getMode().toUpperCase()}`);
    console.log(`📂 [DB Path] ${dbService.getDbFilePath()}`);
    console.log(`===============================================================\n`);
  });

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[CyberTrace] Port ${port} is already in use by another process.`);
      console.log(`[CyberTrace] Automatically switching to port ${port + 1}...`);
      listenOnPort(port + 1);
    } else {
      console.error('[CyberTrace Server Error]:', err);
    }
  });
}

listenOnPort(Number(PORT));
