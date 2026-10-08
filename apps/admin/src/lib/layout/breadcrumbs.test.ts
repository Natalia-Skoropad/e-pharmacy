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

  assert.deepEqual(getAdminBreadcrumbsByPathname(ADMIN_ROUTES.PROFILE), [
    { label: 'Profile' },
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

  assert.deepEqual(
    getAdminBreadcrumbsByPathname(ADMIN_ROUTES.SETTINGS_POSITIONS),
    [{ label: 'Settings' }, { label: 'Positions' }]
  );

  assert.deepEqual(
    getAdminBreadcrumbsByPathname(ADMIN_ROUTES.SETTINGS_ACTIVITY),
    [{ label: 'Settings' }, { label: 'Activity history' }]
  );
});

//===================================================================

test('pharmacy owner detail breadcrumbs link back to the list and accept the loaded owner name', () => {
  const ownerId = '507f1f77bcf86cd799439011';
  const pathname = `${ADMIN_ROUTES.PHARMACY_OWNERS}/${ownerId}`;

  assert.deepEqual(getAdminBreadcrumbsByPathname(pathname), [
    { label: 'Pharmacy Owners', href: ADMIN_ROUTES.PHARMACY_OWNERS },
    { label: `Owner #${ownerId}` },
  ]);

  assert.deepEqual(getAdminBreadcrumbsByPathname(pathname, 'Nata Six'), [
    { label: 'Pharmacy Owners', href: ADMIN_ROUTES.PHARMACY_OWNERS },
    { label: 'Nata Six' },
  ]);
});

//===================================================================

test('pharmacy owner filter routes keep the list breadcrumb only', () => {
  assert.deepEqual(
    getAdminBreadcrumbsByPathname(
      `${ADMIN_ROUTES.PHARMACY_OWNERS}/status-active`
    ),
    [{ label: 'Pharmacy Owners' }]
  );
});

//===================================================================

test('unknown admin routes do not invent breadcrumb labels', () => {
  assert.deepEqual(getAdminBreadcrumbsByPathname('/admin/unknown'), []);
});
