const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createServer, isPathSafe } = require('../src/server/server');

test('isPathSafe correctly detects directory traversal attempts', () => {
  const base = '/var/www/ui';
  assert.equal(isPathSafe(base, '/var/www/ui/index.html'), true);
  assert.equal(isPathSafe(base, '/var/www/ui/../etc/passwd'), false);
});

test('HTTP server receives webhook at /hook/test and streams events', async () => {
  const { server, store, sseManager } = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    // 1. Post webhook to /hook/test
    const postData = JSON.stringify({ event: 'test.event', amount: 99 });
    const res = await new Promise((resolve, reject) => {
      const req = http.request(`http://127.0.0.1:${port}/hook/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => resolve({ statusCode: response.statusCode, data: JSON.parse(body) }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.data.received, true);

    // 2. Fetch /api/events
    const eventsRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/events`, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    assert.equal(eventsRes.length, 1);
    assert.equal(eventsRes[0].body.event, 'test.event');
  } finally {
    sseManager.closeAll();
    await new Promise(resolve => server.close(resolve));
  }
});
