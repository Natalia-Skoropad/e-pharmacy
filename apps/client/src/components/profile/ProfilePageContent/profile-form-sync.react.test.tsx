import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldSyncProfileForm } from './profile-form-sync';

//===================================================================

test('background auth revalidation preserves a dirty profile draft', () => {
  assert.equal(
    shouldSyncProfileForm({
      previousUserId: '507f1f77bcf86cd799439011',
      nextUserId: '507f1f77bcf86cd799439011',
      isDirty: true,
    }),
    false
  );
});

//===================================================================

test('account switching resets profile state even when the previous draft is dirty', () => {
  assert.equal(
    shouldSyncProfileForm({
      previousUserId: '507f1f77bcf86cd799439011',
      nextUserId: '507f1f77bcf86cd799439012',
      isDirty: true,
    }),
    true
  );
});
