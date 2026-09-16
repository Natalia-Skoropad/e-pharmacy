import assert from 'node:assert/strict';
import test from 'node:test';

import { redactRequestPath } from './redaction.ts';

//===================================================================

test('redacts sensitive query values case-insensitively', () => {
  const result = redactRequestPath(
    '/password-reset?EMAIL=user@example.com&access_token=secret&Page=2'
  );

  assert.match(result, /EMAIL=%5BREDACTED%5D/);
  assert.match(result, /access_token=%5BREDACTED%5D/);
  assert.match(result, /Page=2/);
  assert.doesNotMatch(result, /user%40example\.com|secret/);
});

//===================================================================

test('redacts private client search query values', () => {
  const result = redactRequestPath(
    '/api/clients?name=Natalia&contact=user@example.com&phone=%2B380501234567&address=Main%20Street&clientId=507f1f77bcf86cd799439011&page=2'
  );

  assert.match(result, /name=%5BREDACTED%5D/);
  assert.match(result, /contact=%5BREDACTED%5D/);
  assert.match(result, /phone=%5BREDACTED%5D/);
  assert.match(result, /address=%5BREDACTED%5D/);
  assert.match(result, /clientId=%5BREDACTED%5D/);
  assert.match(result, /page=2/);

  assert.doesNotMatch(
    result,
    /Natalia|user%40example\.com|380501234567|Main(?:%20|\+)Street|507f1f77bcf86cd799439011/
  );
});

//===================================================================

test('does not redact ordinary name queries outside private clients', () => {
  const result = redactRequestPath('/products?name=Aspirin&page=2');

  assert.match(result, /name=Aspirin/);
  assert.match(result, /page=2/);
});

//===================================================================

test('redacts private order client search values', () => {
  for (const path of [
    '/api/orders?client=Natalia%20Skoropad&status=new&page=2',
    '/orders?client=Natalia%20Skoropad&status=new&page=2',
  ]) {
    const result = redactRequestPath(path);

    assert.match(result, /client=%5BREDACTED%5D/);
    assert.match(result, /status=new/);
    assert.match(result, /page=2/);
    assert.doesNotMatch(result, /Natalia|Skoropad/);
  }
});

//===================================================================

test('redacts private order comment search values', () => {
  for (const path of [
    '/api/orders?clientComment=Please%20call%20Olena%20at%20%2B380501234567&comment=Gate%20code%201234&page=2',
    '/orders?clientComment=Please%20call%20Olena%20at%20%2B380501234567&comment=Gate%20code%201234&page=2',
  ]) {
    const result = redactRequestPath(path);

    assert.match(result, /clientComment=%5BREDACTED%5D/);
    assert.match(result, /comment=%5BREDACTED%5D/);
    assert.match(result, /page=2/);
    assert.doesNotMatch(result, /Olena|380501234567|Gate(?:%20|\+)code|1234/);
  }
});

//===================================================================

test('does not redact ordinary comment queries outside private orders', () => {
  const result = redactRequestPath('/products?comment=aspirin&page=2');

  assert.match(result, /comment=aspirin/);
  assert.match(result, /page=2/);
});
