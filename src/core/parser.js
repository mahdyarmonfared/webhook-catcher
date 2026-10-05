/**
 * HTTP Request Payload & Query Parser for WebhookCatcher.
 */

const { URL } = require('url');

function parseQueryParams(urlStr) {
  try {
    const parsedUrl = new URL(urlStr, 'http://localhost');
    const query = {};
    parsedUrl.searchParams.forEach((val, key) => {
      query[key] = val;
    });
    return query;
  } catch (err) {
    return {};
  }
}

function parseRawBody(rawStr, contentType = '') {
  if (!rawStr || !rawStr.trim()) return null;

  const lowerType = contentType.toLowerCase();

  if (lowerType.includes('application/json') || rawStr.trim().startsWith('{') || rawStr.trim().startsWith('[')) {
    try {
      return JSON.parse(rawStr);
    } catch (err) {
      // Fallback to raw string if JSON parsing fails
      return rawStr;
    }
  }

  if (lowerType.includes('application/x-www-form-urlencoded')) {
    try {
      const params = new URLSearchParams(rawStr);
      const parsed = {};
      params.forEach((val, key) => {
        parsed[key] = val;
      });
      return parsed;
    } catch (err) {
      return rawStr;
    }
  }

  return rawStr;
}

function parseIncomingRequest(req) {
  return new Promise((resolve, reject) => {
    let rawData = '';

    req.on('data', (chunk) => {
      rawData += chunk.toString();
      if (rawData.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload size limit exceeded'));
      }
    });

    req.on('end', () => {
      const urlPath = req.url.split('?')[0];
      const query = parseQueryParams(req.url);
      const contentType = req.headers['content-type'] || 'text/plain';
      const body = parseRawBody(rawData, contentType);
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

      resolve({
        method: req.method,
        url: req.url,
        path: urlPath,
        query,
        headers: req.headers,
        rawBody: rawData,
        body,
        contentType,
        contentLength: Buffer.byteLength(rawData),
        clientIp
      });
    });

    req.on('error', reject);
  });
}

module.exports = {
  parseQueryParams,
  parseRawBody,
  parseIncomingRequest
};
