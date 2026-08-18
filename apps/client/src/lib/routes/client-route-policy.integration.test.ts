import assert from 'node:assert/strict';
import test from 'node:test';

import { getSafeApplicationRedirectPath } from '@e-pharmacy/auth/routing';
import type { AuthUser } from '@e-pharmacy/types/auth';
import { parsePublicEntitySlugId } from '@e-pharmacy/validation/url';

import { canAccessClientPrivateRoutes } from '@/lib/auth/client-route-access';
import { MAX_CATALOG_SEGMENTS } from '@/lib/catalog/catalog-param-utils';
import { getCatalogRedirectPage } from '@/lib/catalog/catalog-resource-state';

import {
  isPharmacyCatalogSegment,
  parsePharmacySegments,
} from '@/lib/catalog/pharmacies-catalog-paths';

import {
  mergeProductCatalogFilters,
  parseProductCatalogSearchParams,
} from '@/lib/catalog/product-catalog-filters';

import { parseProductCatalogSegments } from '@/lib/catalog/product-catalog-paths';

import {
  CLIENT_GUEST_PREFERRED_ROUTES,
  CLIENT_PRIVATE_ROUTE_PREFIXES,
  CLIENT_TOKEN_ACCESS_ROUTES,
} from './access-policy';

import { ROUTES } from './routes';

import {
  getCheckoutPharmacyIdFromPathParam,
  getOrderIdFromPathParam,
} from './route-builders';

import { resolveLegacyPublicEntity } from './legacy-public-route';

//===================================================================

const ID = '507f1f77bcf86cd799439011';

//===================================================================

function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: ID,
    name: 'Client',
    email: 'client@example.com',
    phone: '+380501234567',
    role: 'client',
    status: 'active',
    revision: '2026-08-18T12:00:00.000Z',
    ...overrides,
  } as AuthUser;
}

//===================================================================

test('client route access, guest routes and token routes keep distinct semantics', () => {
  assert.equal(canAccessClientPrivateRoutes(createUser()), true);

  assert.equal(
    canAccessClientPrivateRoutes(createUser({ status: 'blocked' })),
    false
  );

  assert.equal(
    canAccessClientPrivateRoutes(createUser({ role: 'pharmacy' })),
    false
  );

  assert.deepEqual(
    [...CLIENT_PRIVATE_ROUTE_PREFIXES],
    [ROUTES.CART, ROUTES.CHECKOUT, ROUTES.PROFILE]
  );

  const guestRoutes = new Set<string>(CLIENT_GUEST_PREFERRED_ROUTES);
  assert.equal(guestRoutes.has(ROUTES.LOGIN), true);
  assert.equal(guestRoutes.has(ROUTES.RESET_PASSWORD), false);
  assert.deepEqual([...CLIENT_TOKEN_ACCESS_ROUTES], [ROUTES.RESET_PASSWORD]);
});

//===================================================================

test('private redirect targets preserve safe local state and reject external destinations', () => {
  assert.equal(
    getSafeApplicationRedirectPath('/checkout/foo?x=1', {
      allowedPrefixes: CLIENT_PRIVATE_ROUTE_PREFIXES,
      fallbackPath: ROUTES.PROFILE,
    }),

    '/checkout/foo?x=1'
  );

  assert.equal(
    getSafeApplicationRedirectPath('https://evil.example/profile', {
      allowedPrefixes: CLIENT_PRIVATE_ROUTE_PREFIXES,
      fallbackPath: ROUTES.PROFILE,
    }),

    ROUTES.PROFILE
  );
});

//===================================================================

test('typed public slugs dispatch by entity type before lookup', () => {
  assert.deepEqual(parsePublicEntitySlugId(`pain-relief-pr${ID}`), {
    entityType: 'product',
    id: ID,
  });

  assert.deepEqual(parsePublicEntitySlugId(`health-hub-ph${ID}`), {
    entityType: 'pharmacy',
    id: ID,
  });
});

//===================================================================

test('legacy root resolution remains product-first for colliding ObjectIds', async () => {
  const calls: string[] = [];

  const result = await resolveLegacyPublicEntity(`legacy-name-${ID}`, {
    lookupProduct: async () => {
      calls.push('product');
      return { status: 'found' as const, product: { id: ID } };
    },

    lookupPharmacy: async () => {
      calls.push('pharmacy');
      return { status: 'found' as const, pharmacy: { id: ID } };
    },
  });

  assert.equal(result?.entityType, 'product');
  assert.deepEqual(calls, ['product']);
});

//===================================================================

test('catalog routes keep path authority, reject malformed pagination and bound catch-all work', () => {
  const pathFilters = parseProductCatalogSegments({
    segments: ['category-medicine'],
  }).filters;

  const queryFilters = parseProductCatalogSearchParams({
    category: 'vitamins',
    page: '01',
  });

  const merged = mergeProductCatalogFilters(pathFilters, queryFilters);
  assert.equal(merged.category, 'medicine');
  assert.equal(merged.page, 1);

  assert.equal(
    parseProductCatalogSegments({ segments: ['page-01'] }).isCanonical,
    false
  );

  const excessiveSegments = Array.from(
    { length: MAX_CATALOG_SEGMENTS + 50 },
    (_, index) => `unknown-${index}`
  );

  assert.deepEqual(
    parseProductCatalogSegments({ segments: excessiveSegments }).issues.map(
      (issue) => issue.code
    ),
    ['too_many']
  );

  assert.deepEqual(
    parsePharmacySegments({ segments: excessiveSegments }).issues.map(
      (issue) => issue.code
    ),
    ['too_many']
  );

  assert.equal(isPharmacyCatalogSegment(`city-${'a'.repeat(24)}`), true);
});

//===================================================================

test('runtime pagination correction only applies to successful known page counts', () => {
  assert.equal(getCatalogRedirectPage(8, 3, { status: 'success' }), 3);
  assert.equal(getCatalogRedirectPage(8, 3, { status: 'unavailable' }), null);
});

//===================================================================

test('private checkout and order labels are advisory while typed IDs remain authoritative', () => {
  assert.equal(
    getCheckoutPharmacyIdFromPathParam(`stale-pharmacy-name-ph${ID}`),
    ID
  );

  assert.equal(getOrderIdFromPathParam(`stale-order-number-ph${ID}`), ID);
});
