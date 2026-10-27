import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePharmacySearchOptionsResponse } from './pharmacy-search-options-parser';

//===================================================================

// A search result keeps its server paging metadata, without an unbounded DTO.
test('accepts paged public pharmacy options', () => {
  const response = parsePharmacySearchOptionsResponse({
    kind: 'pharmacy',
    items: [{ id: '6ac75e0f17684f6f914a45c9', name: 'Test pharmacy' }],
    page: 2,
    perPage: 50,
    total: 215,
    totalPages: 3,
  });

  assert.equal(response.kind, 'pharmacy');
  assert.equal(response.items.length, 1);
  assert.equal(response.page, 2);
  assert.equal(response.totalPages, 3);
});

//===================================================================

test('accepts a paged location list without changing settlement/region', () => {
  const response = parsePharmacySearchOptionsResponse({
    kind: 'location',

    items: [
      {
        settlement: 'Lviv',
        region: 'Lvivska oblast',
        label: 'Lviv (Lvivska oblast)',
      },
    ],

    page: 1,
    perPage: 50,
    total: 1,
    totalPages: 1,
  });

  assert.equal(response.kind, 'location');
  assert.equal(response.items.length, 1);

  if (response.kind === 'location') {
    assert.equal(response.items[0]?.region, 'Lvivska oblast');
  }
});

//===================================================================

test('rejects malformed page metadata and a wrong option kind', () => {
  const base = {
    kind: 'pharmacy',
    items: [],
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 0,
  };

  assert.throws(() =>
    parsePharmacySearchOptionsResponse({ ...base, page: -1 })
  );

  assert.throws(() =>
    parsePharmacySearchOptionsResponse({ ...base, totalPages: '3' })
  );

  assert.throws(() =>
    parsePharmacySearchOptionsResponse({ ...base, kind: 'owner' })
  );
});
