import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAdminActivityUrl,
  DEFAULT_ACTIVITY_URL_STATE,
  parseAdminActivityUrl,
} from './admin-activity-url';

//===================================================================

test('activity URL defaults to the clean canonical route', () => {
  assert.equal(
    buildAdminActivityUrl(DEFAULT_ACTIVITY_URL_STATE),
    '/admin/settings/activity'
  );

  assert.deepEqual(parseAdminActivityUrl(), DEFAULT_ACTIVITY_URL_STATE);
});

//===================================================================

test('all supported activity filters round-trip through readable segments', () => {
  const filters = {
    ...DEFAULT_ACTIVITY_URL_STATE,
    dateFrom: '2026-09-10',
    dateTo: '2026-10-09',
    action: 'pharmacyOwner.photo.updated' as const,
    actorType: 'employee' as const,
    section: 'pharmacyOwners' as const,
    employeeUserId: '507f191e810c19729de860ea',
    page: 3,
    perPage: 50 as const,
  };

  const url = buildAdminActivityUrl(filters);

  assert.equal(
    url,
    '/admin/settings/activity/date-from-2026-09-10/date-to-2026-10-09/change-type-pharmacy-owner-photo-updated/changed-by-employee/section-pharmacy-owners/employee-id-507f191e810c19729de860ea/page-3/per-page-50'
  );

  assert.deepEqual(parseAdminActivityUrl(url.split('/').slice(4)), filters);
});

//===================================================================

test('legacy profile URL maps to Employees and invalid IDs are discarded', () => {
  const parsed = parseAdminActivityUrl([
    'section-profile',
    'owner-id-invalid',
    'page-0',
  ]);

  assert.equal(parsed.section, 'employees');
  assert.equal(parsed.ownerUserId, '');
  assert.equal(parsed.page, 1);

  assert.equal(
    buildAdminActivityUrl(parsed),
    '/admin/settings/activity/section-employees'
  );
});

//===================================================================

test('pharmacy-owner search has its own link without the employee filter', () => {
  const state = {
    ...DEFAULT_ACTIVITY_URL_STATE,
    ownerUserId: '507f1f77bcf86cd799439011',
  };

  assert.equal(
    buildAdminActivityUrl(state),
    '/admin/settings/activity/owner-id-507f1f77bcf86cd799439011'
  );

  assert.deepEqual(
    parseAdminActivityUrl(['owner-id-507f1f77bcf86cd799439011']),
    state
  );
});
