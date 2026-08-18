import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEGACY_PUBLIC_ROUTE_POLICY,
  logLegacyPublicRouteHit,
  resolveLegacyPublicEntity,
} from './legacy-public-route';

//===================================================================

const ID = '507f1f77bcf86cd799439011';
const LEGACY_SLUG = `shared-name-${ID}`;

//===================================================================

test('keeps documented product-first precedence when a legacy ObjectId resolves to both entity types', async () => {
  let pharmacyLookups = 0;

  const result = await resolveLegacyPublicEntity(LEGACY_SLUG, {
    lookupProduct: async () => ({
      status: 'found' as const,
      product: { id: ID, name: 'Product' },
    }),
    lookupPharmacy: async () => {
      pharmacyLookups += 1;
      return {
        status: 'found' as const,
        pharmacy: { id: ID, name: 'Pharmacy' },
      };
    },
  });

  assert.equal(LEGACY_PUBLIC_ROUTE_POLICY.precedence, 'product-first');
  assert.equal(result?.entityType, 'product');
  assert.equal(pharmacyLookups, 0);
});

//===================================================================

test('falls back to pharmacy only when the legacy id is not a product', async () => {
  const result = await resolveLegacyPublicEntity(LEGACY_SLUG, {
    lookupProduct: async () => ({ status: 'not_found' as const }),
    lookupPharmacy: async () => ({
      status: 'found' as const,
      pharmacy: { id: ID, name: 'Pharmacy' },
    }),
  });

  assert.equal(result?.entityType, 'pharmacy');
});

//===================================================================

test('emits structured telemetry for legacy traffic without logging the slug', () => {
  const entries: string[] = [];

  logLegacyPublicRouteHit('product', {
    info: (value) => entries.push(String(value)),
  });

  assert.equal(entries.length, 1);

  const payload = JSON.parse(entries[0] ?? '{}') as Record<string, unknown>;
  assert.equal(payload.event, 'legacy_public_entity_route_hit');
  assert.equal(payload.entityType, 'product');
  assert.equal(payload.precedence, 'product-first');
  assert.equal(payload.reviewDate, '2026-11-30');
  assert.equal(entries[0]?.includes(LEGACY_SLUG), false);
});
