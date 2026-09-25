import assert from 'node:assert/strict';
import test from 'node:test';

import { updateMyAdminEmployeeProfileSchema } from './admin-employee-profile.schema';

//===============================================================

const revision = '2026-09-24T12:00:00.000Z';

//===============================================================

test('admin self profile rejects identity edits', () => {
  assert.equal(
    updateMyAdminEmployeeProfileSchema.safeParse({
      name: 'Platform Owner',
      expectedRevision: revision,
    }).success,
    false
  );

  assert.equal(
    updateMyAdminEmployeeProfileSchema.safeParse({
      email: 'owner@example.com',
      expectedRevision: revision,
    }).success,
    false
  );
});

//===============================================================

test('admin self profile accepts picture updates and removal', () => {
  assert.equal(
    updateMyAdminEmployeeProfileSchema.safeParse({
      pictureUrl: 'https://example.com/avatar.png',
      expectedRevision: revision,
    }).success,
    true
  );

  assert.equal(
    updateMyAdminEmployeeProfileSchema.safeParse({
      pictureUrl: null,
      expectedRevision: revision,
    }).success,
    true
  );
});

//===============================================================

test('admin self profile requires a mutation field and a valid revision', () => {
  assert.equal(
    updateMyAdminEmployeeProfileSchema.safeParse({
      expectedRevision: revision,
    }).success,
    false
  );

  assert.equal(
    updateMyAdminEmployeeProfileSchema.safeParse({
      pictureUrl: null,
      expectedRevision: 'not-a-revision',
    }).success,
    false
  );
});
