/**
 * IRCTC Next-Gen Prototype RESTful API Server
 * Built with Node.js built-in HTTP and SQLite (node:sqlite)
 * Zero external npm dependencies - self-contained & resilient prototype
 */

const http = require('node:http');
const url = require('node:url');
const fs = require('node:fs');
const path = require('node:path');

const {
  db,
  searchTrains,
  getTrainByNo,
  createBooking,
  getBookingByPnr,
  getSystemHealth
} = require('./db.js');

const { OPENAPI_SPEC } = require('./openapi.js');
const { renderDocsHtml } = require('./docsHtml.js');

const PORT = process.env.PORT || 8086;
const STATIC_ROOT = path.join(__dirname, '..');

// Standard Content Types
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

/**
 * Send JSON response with standard CORS
 */
function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Powered-By': 'IRCTC-NextGen-Engine/1.0.0'
  });
  res.end(payload);
}

/**
 * Handle Static Files fallback (serving frontend if requested via 8086)
 */
function serveStaticFile(req, res, pathname) {
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '' || safePath === '\\' || safePath === path.sep) {
    safePath = 'index.html';
  }

  const filePath = path.join(STATIC_ROOT, safePath);

  // Security check: ensure filePath is within STATIC_ROOT
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

/**
 * Primary HTTP Request Handler
 */
const server = http.createServer((req, res) => {
  const t0 = performance.now();
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Log incoming request
  res.on('finish', () => {
    const elapsed = Math.round(performance.now() - t0);
    console.log(`[API] ${method} ${pathname} -> ${res.statusCode} (${elapsed}ms)`);
  });

  // CORS Preflight Handler
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // -------------------------------------------------------------
  // REST API Routes
  // -------------------------------------------------------------

  // 1. GET /api/health
  if (method === 'GET' && pathname === '/api/health') {
    const health = getSystemHealth();
    return sendJson(res, 200, health);
  }

  // 2. GET /api/docs (Swagger / OpenAPI UI)
  if (method === 'GET' && (pathname === '/api/docs' || pathname === '/api/docs/')) {
    const html = renderDocsHtml();
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(html);
  }

  // 3. GET /api/openapi.json
  if (method === 'GET' && pathname === '/api/openapi.json') {
    return sendJson(res, 200, OPENAPI_SPEC);
  }

  // 4. GET /api/trains/search
  if (method === 'GET' && pathname === '/api/trains/search') {
    try {
      const q = parsedUrl.query;
      const from = q.from || '';
      const to = q.to || '';
      const date = q.date || new Date().toISOString().split('T')[0];
      const quota = (q.quota || 'GN').toUpperCase();
      const vandeOnly = q.vandeOnly === 'true' || q.vandeOnly === '1';
      const availableOnly = q.availableOnly === 'true' || q.availableOnly === '1';
      const acOnly = q.acOnly === 'true' || q.acOnly === '1';

      const results = searchTrains({
        from,
        to,
        date,
        quota,
        vandeOnly,
        availableOnly,
        acOnly
      });

      return sendJson(res, 200, {
        success: true,
        count: results.length,
        searchParams: { from, to, date, quota, vandeOnly, availableOnly, acOnly },
        trains: results
      });
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: 'Failed to search trains',
        message: err.message
      });
    }
  }

  // 5. GET /api/trains/:trainNo
  const trainDetailMatch = pathname.match(/^\/api\/trains\/([a-zA-Z0-9]+)$/);
  if (method === 'GET' && trainDetailMatch) {
    const trainNo = trainDetailMatch[1];
    const train = getTrainByNo(trainNo);
    if (!train) {
      return sendJson(res, 404, {
        success: false,
        error: `Train #${trainNo} not found in railway database.`
      });
    }
    return sendJson(res, 200, {
      success: true,
      train
    });
  }

  // 6. POST /api/bookings
  if (method === 'POST' && pathname === '/api/bookings') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB protection
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const booking = createBooking(payload);
        return sendJson(res, 201, booking);
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Reservation rejected',
          message: err.message
        });
      }
    });
    return;
  }

  // 7. GET /api/pnr/:pnrNo
  const pnrMatch = pathname.match(/^\/api\/pnr\/([0-9]{10})$/);
  if (method === 'GET' && pnrMatch) {
    const pnrNo = pnrMatch[1];
    const record = getBookingByPnr(pnrNo);
    if (!record) {
      return sendJson(res, 404, {
        success: false,
        error: 'PNR Record Not Found',
        pnr: pnrNo,
        message: `No active reservation found for 10-digit PNR ${pnrNo}.`
      });
    }
    return sendJson(res, 200, {
      success: true,
      ...record
    });
  }

  // Root redirect to docs or serve frontend
  if (method === 'GET' && pathname.startsWith('/api/')) {
    return sendJson(res, 404, {
      success: false,
      error: 'Endpoint Not Found',
      availableEndpoints: [
        'GET /api/health',
        'GET /api/docs',
        'GET /api/openapi.json',
        'GET /api/trains/search?from=NDLS&to=BSB&quota=GN',
        'GET /api/trains/:trainNo',
        'POST /api/bookings',
        'GET /api/pnr/:pnrNo'
      ]
    });
  }

  // Serve static files from root directory
  if (method === 'GET') {
    return serveStaticFile(req, res, pathname);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚆 IRCTC Next-Gen REST API Server Live on Port ${PORT}`);
  console.log(`🔗 REST API URL:       http://localhost:${PORT}/api/trains/search`);
  console.log(`📖 Swagger API Docs:   http://localhost:${PORT}/api/docs`);
  console.log(`💓 Health Diagnostic:  http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n[API] Gracefully shutting down IRCTC API Server...');
  server.close(() => {
    console.log('[API] Server closed.');
    process.exit(0);
  });
});

module.exports = server;
