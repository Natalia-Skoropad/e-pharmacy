import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_ROUTES } from '@/lib/routes';

import { getAdminBreadcrumbsByPathname } from './breadcrumbs';

//===================================================================

test('flat admin routes derive breadcrumbs from canonical pathname families', () => {
  assert.deepEqual(getAdminBreadcrumbsByPathname(ADMIN_ROUTES.DASHBOARD), [
    { label: 'Dashboard' },
  ]);

  assert.deepEqual(getAdminBreadcrumbsByPathname(ADMIN_ROUTES.ORDERS), [
    { label: 'Orders' },
  ]);
});

//===================================================================

test('nested admin routes expose their group and child labels', () => {
  assert.deepEqual(
    getAdminBreadcrumbsByPathname(ADMIN_ROUTES.REVIEWS_PRODUCTS),
    [{ label: 'Reviews' }, { label: 'Product reviews' }]
  );

  assert.deepEqual(
    getAdminBreadcrumbsByPathname(
      `${ADMIN_ROUTES.SETTINGS_EMPLOYEES}/507f1f77bcf86cd799439011`
    ),
    [{ label: 'Settings' }, { label: 'Employees' }]
  );
});

//===================================================================

test('unknown admin routes do not invent breadcrumb labels', () => {
  assert.deepEqual(getAdminBreadcrumbsByPathname('/admin/unknown'), []);
});
