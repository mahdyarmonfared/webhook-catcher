const test = require('node:test');
const assert = require('node:assert/strict');
const { WebhookStore } = require('../src/core/store');

test('WebhookStore adds entries and respects max ring buffer size', () => {
  const store = new WebhookStore(3);
  store.addRequest({ method: 'POST', url: '/hook/1' });
  store.addRequest({ method: 'POST', url: '/hook/2' });
  store.addRequest({ method: 'POST', url: '/hook/3' });
  store.addRequest({ method: 'POST', url: '/hook/4' });

  const requests = store.getRequests();
  assert.equal(requests.length, 3);
  assert.equal(requests[0].url, '/hook/4'); // Most recent first
  assert.ok(requests[0].id.startsWith('wh_'));
});

test('WebhookStore retrieves entry by ID and clears history', () => {
  const store = new WebhookStore();
  const added = store.addRequest({ method: 'GET', url: '/hook/test' });

  const found = store.getRequestById(added.id);
  assert.equal(found.id, added.id);

  store.clear();
  assert.equal(store.getRequests().length, 0);
});
