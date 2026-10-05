const test = require('node:test');
const assert = require('node:assert/strict');
const { parseQueryParams, parseRawBody } = require('../src/core/parser');

test('parseQueryParams parses query string parameters accurately', () => {
  const query = parseQueryParams('/hook/stripe?event=payment&user_id=123');
  assert.equal(query.event, 'payment');
  assert.equal(query.user_id, '123');
});

test('parseRawBody parses JSON and URL-encoded content types', () => {
  const jsonParsed = parseRawBody('{"key":"value"}', 'application/json');
  assert.equal(jsonParsed.key, 'value');

  const formParsed = parseRawBody('foo=bar&baz=qux', 'application/x-www-form-urlencoded');
  assert.equal(formParsed.foo, 'bar');
  assert.equal(formParsed.baz, 'qux');
});
