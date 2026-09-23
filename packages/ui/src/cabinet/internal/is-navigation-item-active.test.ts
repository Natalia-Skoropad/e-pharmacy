import assert from 'node:assert/strict';
import test from 'node:test';

import type { NavigationItem } from '../../navigation/types';

import {
  isNavigationItemActive,
  isNavigationLinkActive,
} from './is-navigation-item-active';

//===================================================================

const navigation: readonly NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    exact: true,
  },
  {
    type: 'group',
    label: 'Reviews',
    children: [
      { label: 'Pharmacy reviews', href: '/admin/reviews/pharmacies' },
      { label: 'Product reviews', href: '/admin/reviews/products' },
    ],
  },
];

//===================================================================

test('flat navigation preserves exact and descendant route matching', () => {
  const dashboard = navigation[0];
  assert.ok(dashboard && dashboard.type !== 'group');

  assert.equal(isNavigationLinkActive(dashboard, '/admin/dashboard'), true);

  assert.equal(
    isNavigationLinkActive(dashboard, '/admin/dashboard/extra'),
    false
  );

  const reviewsChild = navigation[1];
  assert.ok(reviewsChild && reviewsChild.type === 'group');

  assert.equal(
    isNavigationLinkActive(
      reviewsChild.children[0],
      '/admin/reviews/pharmacies/507f1f77bcf86cd799439011'
    ),
    true
  );
});

//===================================================================

test('active child marks its parent group active', () => {
  const reviews = navigation[1];
  assert.ok(reviews);

  assert.equal(
    isNavigationItemActive(reviews, '/admin/reviews/products'),
    true
  );
});
