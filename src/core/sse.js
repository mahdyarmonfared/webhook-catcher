/**
 * Server-Sent Events (SSE) Real-Time Broadcast Manager for WebhookCatcher.
 */

class SseManager {
  constructor() {
    this.clients = new Set();
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), 15000);
  }

  addClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(':connected\n\n');
    this.clients.add(res);

    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventType, data) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    });
  }

  sendHeartbeat() {
    this.clients.forEach((client) => {
      try {
        client.write(':ping\n\n');
      } catch (err) {
        this.clients.delete(client);
      }
    });
  }

  closeAll() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.clients.forEach(client => client.end());
    this.clients.clear();
  }
}

module.exports = {
  SseManager
};
