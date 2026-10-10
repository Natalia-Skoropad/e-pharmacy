import assert from 'node:assert/strict';
import test from 'node:test';

import { canPharmacyProfilePerformAction } from './pharmacy-profile';

//===============================================================

// Test the domain permission matrix independently of the Pharmacy UI.
test('owner may edit/resubmit only after a correction decision', () => {
  assert.equal(
    canPharmacyProfilePerformAction('on_verification', 'edit'),
    false
  );

  assert.equal(
    canPharmacyProfilePerformAction('on_moderation', 'edit', 'pending'),
    false
  );

  assert.equal(
    canPharmacyProfilePerformAction(
      'on_verification',
      'edit',
      'changes_requested'
    ),
    true
  );

  assert.equal(
    canPharmacyProfilePerformAction(
      'on_verification',
      'submit_for_verification',
      'changes_requested'
    ),
    true
  );

  assert.equal(
    canPharmacyProfilePerformAction(
      'on_verification',
      'submit_for_moderation',
      'changes_requested'
    ),
    false
  );

  assert.equal(
    canPharmacyProfilePerformAction(
      'on_moderation',
      'edit',
      'changes_requested'
    ),
    true
  );

  assert.equal(
    canPharmacyProfilePerformAction(
      'on_moderation',
      'submit_for_moderation',
      'changes_requested'
    ),
    true
  );

  assert.equal(
    canPharmacyProfilePerformAction(
      'on_moderation',
      'submit_for_verification',
      'changes_requested'
    ),
    false
  );

  assert.equal(
    canPharmacyProfilePerformAction('blocked', 'edit', 'changes_requested'),
    false
  );

  assert.equal(
    canPharmacyProfilePerformAction('active', 'submit_for_moderation'),
    true
  );

  assert.equal(
    canPharmacyProfilePerformAction('new', 'submit_for_verification'),
    true
  );
});
