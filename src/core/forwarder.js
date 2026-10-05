/**
 * Webhook Forwarding & Replay Engine for WebhookCatcher.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

function forwardWebhook(targetUrl, capturedReq) {
  return new Promise((resolve, reject) => {
    let urlObj;
    try {
      urlObj = new URL(targetUrl);
    } catch (err) {
      reject(new Error(`Invalid forwarding target URL: ${targetUrl}`));
      return;
    }

    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const headers = { ...capturedReq.headers };

    // Clean hop-by-hop headers
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];

    const rawBody = capturedReq.rawBody || (typeof capturedReq.body === 'object' ? JSON.stringify(capturedReq.body) : String(capturedReq.body || ''));
    headers['content-length'] = Buffer.byteLength(rawBody);

    const options = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: `${urlObj.pathname}${urlObj.search}`,
      method: capturedReq.method || 'POST',
      headers
    };

    const startTime = process.hrtime.bigint();

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          durationMs: parseFloat(durationMs.toFixed(2))
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => req.destroy(new Error('Forwarding request timed out')));

    if (rawBody) {
      req.write(rawBody);
    }
    req.end();
  });
}

module.exports = {
  forwardWebhook
};
