import assert from 'node:assert/strict';
import test from 'node:test';

import { pharmacySearchOptionsQuerySchema } from './pharmacy-search-options.schema';

//===============================================================

test('search options default to 50, require a valid kind and reject unbounded pages', () => {
  const parsed = pharmacySearchOptionsQuerySchema.parse({
    kind: 'location',
    query: 'Lviv',
  });

  assert.equal(parsed.page, 1);
  assert.equal(parsed.perPage, 50);
  assert.equal(parsed.kind, 'location');

  assert.equal(
    pharmacySearchOptionsQuerySchema.safeParse({
      kind: 'pharmacy',
      perPage: 51,
    }).success,
    false
  );

  assert.equal(
    pharmacySearchOptionsQuerySchema.safeParse({
      kind: 'location',
      perPage: 30,
    }).success,
    true
  );

  assert.equal(
    pharmacySearchOptionsQuerySchema.safeParse({ kind: 'owner' }).success,
    false
  );

  assert.equal(
    pharmacySearchOptionsQuerySchema.safeParse({
      kind: 'pharmacy',
      unexpected: 'x',
    }).success,
    false
  );
});
