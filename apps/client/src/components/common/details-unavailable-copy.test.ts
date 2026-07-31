import assert from 'node:assert/strict';
import test from 'node:test';

import type { DataUnavailableReason } from '@/lib/api/resource-state';

import {
  formatDetailsSupportReference,
  getDetailsUnavailableCopy,
} from './details-unavailable-copy';

//===================================================================

const REASONS: readonly DataUnavailableReason[] = [
  'timeout',
  'network',
  'rate_limit',
  'invalid_response',
  'unauthorized',
  'forbidden',
  'server_error',
  'service_unavailable',
];

//===================================================================

test('provides explicit user-facing copy for every server data reason', () => {
  for (const reason of REASONS) {
    const copy = getDetailsUnavailableCopy('product', reason);
    assert.ok(copy.title.trim());
    assert.ok(copy.description.includes('product details'));
    assert.ok(copy.retryLabel.trim());
    assert.doesNotMatch(copy.description, /backend API|localhost/i);
  }

  assert.notEqual(
    getDetailsUnavailableCopy('product', 'unauthorized').title,
    getDetailsUnavailableCopy('product', 'service_unavailable').title
  );

  assert.notEqual(
    getDetailsUnavailableCopy('product', 'forbidden').title,
    getDetailsUnavailableCopy('product', 'service_unavailable').title
  );
});

//===================================================================

test('shows a short optional support reference without exposing the full ID', () => {
  assert.equal(formatDetailsSupportReference(), '');
  assert.equal(formatDetailsSupportReference('   '), '');

  assert.equal(
    formatDetailsSupportReference('request-1234567890-sensitive-tail'),
    ' Support reference: request-1234.'
  );
});
