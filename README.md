# 🎣 WebhookCatcher

> Lightweight, zero-dependency local webhook inspection server, debugger & real-time Web Studio powered by Server-Sent Events (SSE).

![WebhookCatcher Web Studio](https://raw.githubusercontent.com/mahdyarmonfared/webhook-catcher/main/docs/preview.png)

## ⚡ Features

- 🎣 **Wildcard Ingestion Endpoint**: Capture incoming HTTP requests (POST, GET, PUT, DELETE) at `http://localhost:3016/hook/<any-name>`.
- ⚡ **Real-Time SSE Live Stream**: Instant updates streamed live to the browser without page refreshes using Server-Sent Events.
- 🔍 **Full Header & Payload Inspection**: Inspect formatted JSON, URL-encoded forms, query parameters, client IP, and request size.
- 🔁 **Webhook Replay & Forwarding**: Forward captured payloads to local development servers (`http://localhost:8080/api/webhook`).
- 🌐 **Interactive Web Studio**: Built-in web GUI dashboard hosted on `http://localhost:3016`.
- 📦 **Zero Dependencies**: 100% pure Node.js standard modules (`http`, `https`, `url`, `fs`, `node:test`).

---

## 🛠️ Installation

```bash
git clone https://github.com/mahdyarmonfared/webhook-catcher.git
cd webhook-catcher
npm link
```

---

## 🚀 Quick Start

### 1. Launch Webhook Catcher Server

```bash
webhook-catcher --port 3016
```

### 2. Send Webhook Payload

```bash
curl -X POST http://localhost:3016/hook/stripe \
  -H "Content-Type: application/json" \
  -d '{"event": "payment_intent.succeeded", "amount": 4900}'
```

### 3. Open Web Studio Dashboard

Open `http://localhost:3016` in your browser to inspect incoming webhooks in real time.

---

## 📖 CLI Usage

```text
USAGE:
  webhook-catcher [options]

OPTIONS:
  -p, --port <number>     Port for Webhook Catcher server (default: 3016)
  -h, --help              Display help guide
  -v, --version           Display version
```

---

## 💻 Programmatic Usage

```javascript
const { createServer } = require('webhook-catcher');

const { server, store } = createServer();
server.listen(3016, () => {
  console.log('Webhook Catcher listening on port 3016');
});
```

---

## 🧪 Testing

Run native test suite:

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE) © Mahdyar Monfared
