import assert from 'node:assert/strict';
import test from 'node:test';

import { getPharmacyBreadcrumbsByPathname } from './breadcrumbs';

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

test('canonical filter segments are never classified as entity detail ids', () => {
  for (const [pathname, expectedLabel] of FILTER_CASES) {
    assert.deepEqual(getPharmacyBreadcrumbsByPathname(pathname), [
      { label: expectedLabel },
    ]);
  }
});

//===================================================================

test('real entity ids still produce detail breadcrumbs for each domain', () => {
  const id = '507f1f77bcf86cd799439011';

  assert.deepEqual(getPharmacyBreadcrumbsByPathname(`/pharmacy/orders/${id}`), [
    { label: 'Orders', href: '/pharmacy/orders' },
    { label: `Order #${id}` },
  ]);

  assert.deepEqual(
    getPharmacyBreadcrumbsByPathname(`/pharmacy/clients/${id}`),
    [
      { label: 'Clients', href: '/pharmacy/clients' },
      { label: `Client #${id}` },
    ]
  );
});
