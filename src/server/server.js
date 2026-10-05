/**
 * HTTP Server, Webhook Ingestion Receiver, and SSE Live Stream Host for WebhookCatcher.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebhookStore, parseIncomingRequest, SseManager, forwardWebhook } = require('../core');
const { chalk } = require('../cli/ansi');

const UI_DIR = path.join(__dirname, '../ui');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function isPathSafe(baseDir, targetPath) {
  const resolved = path.resolve(targetPath);
  return resolved === baseDir || resolved.startsWith(baseDir + path.sep);
}

function handleStaticFile(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const filePath = path.join(UI_DIR, reqPath);

  if (!isPathSafe(UI_DIR, filePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Directory traversal blocked');
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

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

function createServer(storeOptions = {}) {
  const store = new WebhookStore(storeOptions.maxEntries || 100);
  const sseManager = new SseManager();

  const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const urlPath = req.url.split('?')[0];

    // Real-Time SSE Stream Endpoint
    if (urlPath === '/api/events/stream' && req.method === 'GET') {
      sseManager.addClient(req, res);
      return;
    }

    // Get Recent Webhooks
    if (urlPath === '/api/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(store.getRequests()));
      return;
    }

    // Clear Webhook Log
    if (urlPath === '/api/events' && req.method === 'DELETE') {
      store.clear();
      sseManager.broadcast('clear', {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Webhook history cleared' }));
      return;
    }

    // Replay / Forward Webhook Payload
    if (urlPath === '/api/forward' && req.method === 'POST') {
      try {
        const parsed = await parseIncomingRequest(req);
        const { eventId, targetUrl } = parsed.body || {};

        if (!eventId || !targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'eventId and targetUrl are required' }));
          return;
        }

        const captured = store.getRequestById(eventId);
        if (!captured) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Captured webhook not found' }));
          return;
        }

        const forwardResult = await forwardWebhook(targetUrl, captured);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(forwardResult));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Health Check Endpoint
    if (urlPath === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', name: 'webhook-catcher', version: '1.0.0' }));
      return;
    }

    // Webhook Ingestion Routes: /hook/* or /catch/* or /webhook
    if (urlPath.startsWith('/hook') || urlPath.startsWith('/catch') || urlPath === '/webhook') {
      try {
        const reqData = await parseIncomingRequest(req);
        const entry = store.addRequest(reqData);

        // Terminal Log
        const methodColored = chalk.bold(chalk.cyan(`[${reqData.method}]`));
        console.log(`🎣 Webhook Caught: ${methodColored} ${chalk.yellow(reqData.url)} (${reqData.contentLength} bytes) from ${reqData.clientIp}`);

        // Broadcast to Web Studio clients via SSE
        sseManager.broadcast('webhook', entry);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          received: true,
          id: entry.id,
          timestamp: entry.timestamp
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Static Web Studio Asset Delivery
    if (req.method === 'GET') {
      handleStaticFile(req, res);
      return;
    }

    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  });

  return { server, store, sseManager };
}

function startServer(port = 3016) {
  const { server } = createServer();
  server.listen(port, () => {
    console.log(`\n🎣 WebhookCatcher Studio & Ingestion Server running at: http://localhost:${port}`);
    console.log(`  - Ingest URL: http://localhost:${port}/hook/any-name`);
    console.log(`  - Web Studio: http://localhost:${port}\n`);
    console.log(`Listening for incoming webhooks...\n`);
  });
  return server;
}

module.exports = {
  createServer,
  startServer,
  isPathSafe
};
