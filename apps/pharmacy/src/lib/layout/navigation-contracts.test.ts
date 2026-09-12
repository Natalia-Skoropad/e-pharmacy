import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  PHARMACY_NAVIGATION,
  getPharmacyNavigationItemByPathname,
} from './navigation';

//===================================================================

test('keeps pharmacy navigation unique and tied to existing route constants', () => {
  const labels = PHARMACY_NAVIGATION.map((item) => item.label);
  const hrefs = PHARMACY_NAVIGATION.map((item) => item.href);

  assert.equal(labels.length > 0, true);
  assert.equal(new Set(labels).size, labels.length);
  assert.equal(new Set(hrefs).size, hrefs.length);

  assert.deepEqual(hrefs, [
    PHARMACY_ROUTES.DASHBOARD,
    PHARMACY_ROUTES.ORDERS,
    PHARMACY_ROUTES.CLIENTS,
    PHARMACY_ROUTES.PRODUCTS,
    PHARMACY_ROUTES.ALL_PRODUCTS,
    PHARMACY_ROUTES.PRODUCT_REQUESTS,
  ]);

  assert.equal(
    PHARMACY_NAVIGATION.some((item) => item.href === PHARMACY_ROUTES.PROFILE),
    false
  );
});

//===================================================================

test('top bar presentation derives section identity from pathname instead of display labels', () => {
  const entityId = '507f1f77bcf86cd799439011';

  assert.equal(
    getPharmacyNavigationItemByPathname(`/pharmacy/orders/${entityId}`)?.href,
    PHARMACY_ROUTES.ORDERS
  );

  assert.equal(
    getPharmacyNavigationItemByPathname('/pharmacy/products/status-active')
      ?.href,
    PHARMACY_ROUTES.PRODUCTS
  );

  assert.equal(
    getPharmacyNavigationItemByPathname(PHARMACY_ROUTES.PROFILE)?.href,
    PHARMACY_ROUTES.PROFILE
  );
});

//===================================================================

test('PharmacyHeader does not use breadcrumb labels as route identity', async () => {
  const source = await readFile(
    new URL(
      '../../components/layout/PharmacyHeader/PharmacyHeader.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.equal(source.includes('getTopBarIcon'), false);
  assert.equal(source.includes("label === 'Orders'"), false);
  assert.equal(source.includes('breadcrumbs[0]?.label'), false);
  assert.match(source, /getPharmacyNavigationItemByPathname\(pathname\)/);
});
