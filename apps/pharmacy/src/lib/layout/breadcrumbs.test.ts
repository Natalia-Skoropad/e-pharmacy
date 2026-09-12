import assert from 'node:assert/strict';
import test from 'node:test';

import { getPharmacyBreadcrumbsByPathname } from './breadcrumbs';

//===================================================================

const ENTITY_ID = '507f1f77bcf86cd799439011';

//===================================================================

const FILTER_CASES = [
  ['/pharmacy/orders/created-by-manager', 'Orders'],
  ['/pharmacy/orders/status-in-progress', 'Orders'],
  ['/pharmacy/clients/successful-orders-repeat', 'Clients'],
  ['/pharmacy/clients/contact-private-value', 'Clients'],
  ['/pharmacy/products/stock-reserved', 'Own products'],
  ['/pharmacy/all-products/added-to-my-pharmacy-no', 'All products'],
  ['/pharmacy/product-requests/status-in-progress', 'Product requests'],
] as const;

//===================================================================

test('base and new routes derive breadcrumbs from canonical route families', () => {
  assert.deepEqual(getPharmacyBreadcrumbsByPathname('/pharmacy/dashboard'), [
    { label: 'Dashboard' },
  ]);

  assert.deepEqual(getPharmacyBreadcrumbsByPathname('/pharmacy/profile'), [
    { label: 'Pharmacy profile' },
  ]);

  assert.deepEqual(getPharmacyBreadcrumbsByPathname('/pharmacy/orders/new'), [
    { label: 'Orders', href: '/pharmacy/orders' },
    { label: 'New order' },
  ]);

  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname('/pharmacy/product-requests/new'),
    [
      { label: 'Product requests', href: '/pharmacy/product-requests' },
      { label: 'New product request' },
    ]
  );
});

//===================================================================

test('canonical filter segments are never classified as entity detail ids', () => {
  for (const [pathname, expectedLabel] of FILTER_CASES) {
    assert.deepEqual(getPharmacyBreadcrumbsByPathname(pathname), [
      { label: expectedLabel },
    ]);
  }
});

//===================================================================

test('real entity ids still produce detail breadcrumbs for each domain', () => {
  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname(`/pharmacy/orders/${ENTITY_ID}`),
    [
      { label: 'Orders', href: '/pharmacy/orders' },
      { label: `Order #${ENTITY_ID}` },
    ]
  );

  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname(`/pharmacy/clients/${ENTITY_ID}`),
    [
      { label: 'Clients', href: '/pharmacy/clients' },
      { label: `Client #${ENTITY_ID}` },
    ]
  );

  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname(`/pharmacy/products/${ENTITY_ID}`),
    [
      { label: 'Own products', href: '/pharmacy/products' },
      {
        label: `Product ${ENTITY_ID}`,
        href: `/pharmacy/products/${ENTITY_ID}`,
      },
    ]
  );

  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname(`/pharmacy/all-products/${ENTITY_ID}`),
    [
      { label: 'All products', href: '/pharmacy/all-products' },
      {
        label: `Global product ${ENTITY_ID}`,
        href: `/pharmacy/all-products/${ENTITY_ID}`,
      },
    ]
  );

  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname(`/pharmacy/product-requests/${ENTITY_ID}`),
    [
      { label: 'Product requests', href: '/pharmacy/product-requests' },
      {
        label: `Product request ${ENTITY_ID}`,
        href: `/pharmacy/product-requests/${ENTITY_ID}`,
      },
    ]
  );
});

//===================================================================

test('unknown routes and unsupported request edit paths never invent detail breadcrumbs', () => {
  const cases = [
    ['/pharmacy/orders/not-an-id', 'Orders'],
    ['/pharmacy/clients/not-an-id', 'Clients'],
    ['/pharmacy/products/not-an-id', 'Own products'],
    ['/pharmacy/all-products/not-an-id', 'All products'],
    ['/pharmacy/product-requests/not-an-id', 'Product requests'],
    [`/pharmacy/product-requests/${ENTITY_ID}/edit`, 'Product requests'],
  ] as const;

  for (const [pathname, expectedLabel] of cases) {
    assert.deepEqual(getPharmacyBreadcrumbsByPathname(pathname), [
      { label: expectedLabel },
    ]);
  }

  assert.deepEqual(getPharmacyBreadcrumbsByPathname('/pharmacy/not-real'), [
    { label: 'Dashboard' },
  ]);
});
