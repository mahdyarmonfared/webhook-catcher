document.addEventListener('DOMContentLoaded', () => {
  const eventsList = document.getElementById('eventsList');
  const eventCount = document.getElementById('eventCount');
  const detailContainer = document.getElementById('detailContainer');
  const clearBtn = document.getElementById('clearBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');

  const forwardModal = document.getElementById('forwardModal');
  const forwardForm = document.getElementById('forwardForm');
  const closeForwardModal = document.getElementById('closeForwardModal');
  const forwardResult = document.getElementById('forwardResult');

  let activeEvents = [];
  let selectedEventId = null;

  // Initialize SSE Live Stream
  function initSse() {
    const sse = new EventSource('/api/events/stream');

    sse.addEventListener('webhook', (e) => {
      try {
        const item = JSON.parse(e.data);
        activeEvents.unshift(item);
        renderEventsList();
        if (!selectedEventId) {
          selectEvent(item.id);
        }
      } catch (err) {}
    });

    sse.addEventListener('clear', () => {
      activeEvents = [];
      selectedEventId = null;
      renderEventsList();
      renderDetail(null);
    });

    sse.onerror = () => {
      document.getElementById('sseBadge').className = 'badge';
      document.getElementById('sseBadge').textContent = '● SSE RECONNECTING';
    };
  }

  async function fetchEvents() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      activeEvents = data;
      renderEventsList();
      if (activeEvents.length > 0 && !selectedEventId) {
        selectEvent(activeEvents[0].id);
      }
    } catch (err) {}
  }

  function renderEventsList() {
    eventCount.textContent = activeEvents.length;

    if (activeEvents.length === 0) {
      eventsList.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-muted)">Waiting for incoming webhooks...<br><small>Send a POST/GET request to <code>http://localhost:3016/hook/test</code></small></div>';
      return;
    }

    eventsList.innerHTML = '';
    activeEvents.forEach(item => {
      const el = document.createElement('div');
      el.className = `event-item ${item.id === selectedEventId ? 'active' : ''}`;
      el.onclick = () => selectEvent(item.id);

      const timeStr = new Date(item.timestamp).toLocaleTimeString();
      const methodClass = `method-${item.method}`;

      el.innerHTML = `
        <div class="event-item-top">
          <span class="method-badge ${methodClass}">${item.method}</span>
          <span class="event-path">${escapeHtml(item.path)}</span>
        </div>
        <div class="event-item-bottom">
          <span>${item.contentLength} bytes</span>
          <span>${timeStr}</span>
        </div>
      `;

      eventsList.appendChild(el);
    });
  }

  function selectEvent(id) {
    selectedEventId = id;
    renderEventsList();
    const item = activeEvents.find(e => e.id === id);
    renderDetail(item);
  }

  function renderDetail(item) {
    if (!item) {
      detailContainer.innerHTML = '<div class="empty-detail" style="padding: 40px; text-align: center; color: var(--text-muted)">Select a webhook from the left panel to inspect headers and payload body.</div>';
      return;
    }

    const headersRows = Object.entries(item.headers || {}).map(([k, v]) => `
      <tr>
        <td class="key">${escapeHtml(k)}</td>
        <td class="val">${escapeHtml(String(v))}</td>
      </tr>
    `).join('');

    const formattedBody = typeof item.body === 'object' ? JSON.stringify(item.body, null, 2) : (item.rawBody || 'No payload body');

    detailContainer.innerHTML = `
      <div class="detail-header">
        <div>
          <span class="method-badge method-${item.method}">${item.method}</span>
          <code style="font-size: 14px; margin-left: 8px;">${escapeHtml(item.url)}</code>
        </div>
        <button id="forwardBtn" class="btn btn-primary btn-sm">🔁 Forward / Replay</button>
      </div>

      <div class="section-title">Request Headers</div>
      <table class="headers-table">
        <tbody>${headersRows}</tbody>
      </table>

      <div class="section-title">Payload Body (${item.contentType})</div>
      <pre class="json-body">${escapeHtml(formattedBody)}</pre>
    `;

    document.getElementById('forwardBtn').onclick = () => openForwardModal(item);
  }

  // Forward Modal Handlers
  function openForwardModal(item) {
    document.getElementById('forwardEventId').value = item.id;
    forwardResult.classList.add('hidden');
    forwardModal.classList.remove('hidden');
  }

  closeForwardModal.onclick = () => forwardModal.classList.add('hidden');

  forwardForm.onsubmit = async (e) => {
    e.preventDefault();
    const eventId = document.getElementById('forwardEventId').value;
    const targetUrl = document.getElementById('forwardTargetUrl').value.trim();

    forwardResult.classList.remove('hidden');
    forwardResult.innerHTML = 'Forwarding request...';

    try {
      const res = await fetch('/api/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, targetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Forwarding failed');

      forwardResult.innerHTML = `<span style="color: var(--accent-green)">✔ Forwarded successfully! Status: ${data.statusCode} (${data.durationMs} ms)</span>`;
    } catch (err) {
      forwardResult.innerHTML = `<span style="color: var(--accent-red)">✖ Error: ${err.message}</span>`;
    }
  };

  clearBtn.onclick = async () => {
    await fetch('/api/events', { method: 'DELETE' });
  };

  copyUrlBtn.onclick = () => {
    navigator.clipboard.writeText('http://localhost:3016/hook/my-service');
    copyUrlBtn.textContent = 'Copied!';
    setTimeout(() => copyUrlBtn.textContent = 'Copy Ingest URL', 2000);
  };

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  fetchEvents();
  initSse();
});
