import assert from 'node:assert/strict';
import test from 'node:test';

import { ADMIN_ROUTES } from '@/lib/routes';

import {
  ADMIN_NAVIGATION,
  getAdminNavigationItemByPathname,
} from './navigation';

//===================================================================

function getGroup(label: string) {
  const group = ADMIN_NAVIGATION.find(
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

test('reviews and settings use one-level shared navigation groups', () => {
  const reviews = getGroup('Reviews');
  const settings = getGroup('Settings');

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

test('nested admin routes resolve to their parent navigation group', () => {
  assert.equal(
    getAdminNavigationItemByPathname(ADMIN_ROUTES.REVIEWS_PHARMACIES)?.label,
    'Reviews'
  );

  assert.equal(
    getAdminNavigationItemByPathname(
      `${ADMIN_ROUTES.SETTINGS_EMPLOYEES}/507f1f77bcf86cd799439011`
    )?.label,
    'Settings'
  );

  assert.equal(getAdminNavigationItemByPathname('/admin/unknown'), null);
});
