import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_ROUTES } from '@/lib/routes';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  ADMIN_NAVIGATION,
  getAdminNavigationForAccess,
  getAdminNavigationItemByPathname,
} from './navigation';

//===================================================================

function getGroup(items: typeof ADMIN_NAVIGATION, label: string) {
  const group = items.find(
    (item) => item.type === 'group' && item.label === label
  );

  assert.ok(group && group.type === 'group');
  return group;
}

//===================================================================

test('admin navigation keeps canonical top-level routes unique', () => {
  const topLevelLinks = ADMIN_NAVIGATION.filter(
    (item) => item.type !== 'group'
  );

  assert.deepEqual(
    topLevelLinks.map((item) => item.href),
    [
      ADMIN_ROUTES.DASHBOARD,
      ADMIN_ROUTES.PHARMACY_OWNERS,
      ADMIN_ROUTES.PHARMACIES,
      ADMIN_ROUTES.PRODUCTS,
      ADMIN_ROUTES.PRODUCT_REQUESTS,
      ADMIN_ROUTES.CLIENTS,
      ADMIN_ROUTES.ORDERS,
    ]
  );

  assert.equal(
    new Set(topLevelLinks.map((item) => item.href)).size,
    topLevelLinks.length
  );
});

//===================================================================

test('reviews and settings use one-level shared navigation groups including Positions', () => {
  const reviews = getGroup(ADMIN_NAVIGATION, 'Reviews');
  const settings = getGroup(ADMIN_NAVIGATION, 'Settings');

  assert.deepEqual(
    reviews.children.map((item) => [item.label, item.href]),
    [
      ['Pharmacy reviews', ADMIN_ROUTES.REVIEWS_PHARMACIES],
      ['Product reviews', ADMIN_ROUTES.REVIEWS_PRODUCTS],
    ]
  );

  assert.deepEqual(
    settings.children.map((item) => [item.label, item.href]),
    [
      ['Employees', ADMIN_ROUTES.SETTINGS_EMPLOYEES],
      ['Positions', ADMIN_ROUTES.SETTINGS_POSITIONS],
      ['Site pages', ADMIN_ROUTES.SETTINGS_SITE_PAGES],
      ['Product categories', ADMIN_ROUTES.SETTINGS_PRODUCT_CATEGORIES],
    ]
  );

  assert.equal(
    ADMIN_NAVIGATION.some((item) => item.label === 'Roles'),
    false
  );
});

//===================================================================

test('limited access filters children and removes empty groups without using position', () => {
  const productReviewer = getAdminNavigationForAccess({
    status: 'active',
    isPlatformOwner: false,
    permissions: [ADMIN_PERMISSIONS.productReviews.view],
  });

  assert.deepEqual(
    productReviewer.map((item) => item.label),
    ['Dashboard', 'Reviews']
  );

  const reviews = getGroup(productReviewer, 'Reviews');

  assert.deepEqual(
    reviews.children.map((item) => item.label),
    ['Product reviews']
  );

  assert.equal(
    productReviewer.some((item) => item.label === 'Settings'),
    false
  );

  const positionsViewer = getAdminNavigationForAccess({
    status: 'active',
    isPlatformOwner: false,
    permissions: [ADMIN_PERMISSIONS.positions.view],
  });

  const settings = getGroup(positionsViewer, 'Settings');

  assert.deepEqual(
    settings.children.map((item) => item.label),
    ['Positions']
  );
});

//===================================================================

test('Platform Owner receives all permission-controlled navigation', () => {
  assert.deepEqual(
    getAdminNavigationForAccess({
      status: 'active',
      isPlatformOwner: true,
      permissions: [],
    }),

    ADMIN_NAVIGATION
  );
});

//===================================================================

test('nested admin routes resolve against the visible navigation model', () => {
  const items = getAdminNavigationForAccess({
    status: 'active',
    isPlatformOwner: false,
    permissions: [ADMIN_PERMISSIONS.positions.view],
  });

  assert.equal(
    getAdminNavigationItemByPathname(ADMIN_ROUTES.SETTINGS_POSITIONS, items)
      ?.label,
    'Settings'
  );

  assert.equal(
    getAdminNavigationItemByPathname(ADMIN_ROUTES.REVIEWS_PHARMACIES, items),
    null
  );

  assert.equal(getAdminNavigationItemByPathname('/admin/unknown', items), null);
});
