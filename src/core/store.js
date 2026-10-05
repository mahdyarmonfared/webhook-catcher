/**
 * In-Memory Request Store for WebhookCatcher.
 */

class WebhookStore {
  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
    this.requests = [];
    this.counter = 0;
  }

  addRequest(reqData) {
    this.counter++;
    const entry = {
      id: `wh_${Date.now()}_${this.counter}`,
      index: this.counter,
      method: reqData.method || 'POST',
      url: reqData.url || '/',
      path: reqData.path || '/',
      query: reqData.query || {},
      headers: reqData.headers || {},
      body: reqData.body || null,
      rawBody: reqData.rawBody || '',
      contentType: reqData.contentType || 'application/json',
      clientIp: reqData.clientIp || '127.0.0.1',
      contentLength: reqData.contentLength || 0,
      timestamp: new Date().toISOString()
    };

    this.requests.unshift(entry);
    if (this.requests.length > this.maxEntries) {
      this.requests.pop();
    }

    return entry;
  }

  getRequests() {
    return this.requests;
  }

  getRequestById(id) {
    return this.requests.find(r => r.id === id) || null;
  }

  clear() {
    this.requests = [];
  }
}

module.exports = {
  WebhookStore
};
