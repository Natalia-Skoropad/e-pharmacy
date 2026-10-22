import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clonePharmacyLocation,
  clonePendingModerationFields,
} from './pharmacy-location';

//===============================================================

test('copies only declared location fields and detaches GeoJSON coordinates', () => {
  const source = {
    address: '1 Test Street',
    settlement: 'Odesa',
    region: 'Odesa',
    countryCode: 'UA',
    geo: { type: 'Point' as const, coordinates: [30.7, 46.5] as const },
  };

  const next = clonePharmacyLocation(source);

  assert.deepEqual(next, source);
  assert.notEqual(next, source);
  assert.notEqual(next?.geo, source.geo);
  assert.notEqual(next?.geo?.coordinates, source.geo.coordinates);
  assert.equal(clonePharmacyLocation(undefined), undefined);
});

//===============================================================

test('copies pending moderation preserving explicit null and separating nested fields', () => {
  const documents = [
    {
      id: 'doc',
      name: 'Test',
      size: 1,
      type: 'application/pdf',
      sha256: 'hash',
      uploadedAt: '2026-10-21T12:00:00.000Z',
    },
  ];

  const pending = {
    location: { settlement: 'Kyiv' },
    phone: null,
    documents,
    bankDetails: { iban: null },
  };

  const clone = clonePendingModerationFields(pending);

  assert.deepEqual(clone, pending);
  assert.notEqual(clone.documents, documents);
  assert.notEqual(clone.bankDetails, pending.bankDetails);
  assert.notEqual(clone.location, pending.location);
  assert.deepEqual(clonePendingModerationFields(undefined), {});
});
