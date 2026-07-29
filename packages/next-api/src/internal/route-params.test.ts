import assert from 'node:assert/strict';
import test from 'node:test';

import { parseEntityIdSegment, parseEnumRouteSegment } from './route-params.ts';

//===================================================================

const id = '64b7ea389c68bbec640519ab';

//===================================================================

test('accepts a valid entity id', () => {
  assert.equal(parseEntityIdSegment(id, 'productId'), id);
});

//===================================================================

test('rejects path traversal, slashes, and non-object ids', () => {
  assert.throws(() => parseEntityIdSegment('..', 'productId'));
  assert.throws(() => parseEntityIdSegment('%2Fadmin', 'productId'));
  assert.throws(() => parseEntityIdSegment('not-an-object-id', 'productId'));
});

//===================================================================

test('accepts only declared enum route segments', () => {
  assert.equal(
    parseEnumRouteSegment(
      'product_request',
      ['client', 'product_request'],
      'entityType'
    ),
    'product_request'
  );

  assert.throws(() =>
    parseEnumRouteSegment('admin', ['client', 'product_request'], 'entityType')
  );
});
