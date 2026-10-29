import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PHARMACY_PROFILE_ACTIONS_BY_STATUS,
  canPharmacyProfilePerformAction,
} from '../src/pharmacies';

//===================================================================

const EXPECTED = {
  new: ['edit', 'submit_for_verification'],
  on_verification: [],
  on_moderation: [],
  active: ['edit', 'submit_for_moderation'],
  blocked: ['edit'],
  on_reactivation: [],
} as const;

//===================================================================

test('pharmacy profile transition matrix is explicit for every status', () => {
  assert.deepEqual(PHARMACY_PROFILE_ACTIONS_BY_STATUS, EXPECTED);

  for (const [status, actions] of Object.entries(EXPECTED)) {
    for (const action of [
      'edit',
      'submit_for_verification',
      'submit_for_moderation',
    ] as const) {
      assert.equal(
        canPharmacyProfilePerformAction(
          status as keyof typeof EXPECTED,
          action
        ),

        (actions as readonly string[]).includes(action)
      );
    }
  }
});

//===================================================================

test('reviews are immutable during pending and editable after corrections', () => {
  for (const status of [
    'on_verification',
    'on_moderation',
    'on_reactivation',
  ] as const) {
    assert.equal(
      canPharmacyProfilePerformAction(status, 'edit', 'pending'),
      false
    );

    assert.equal(
      canPharmacyProfilePerformAction(status, 'edit', 'changes_requested'),
      true
    );
  }

  assert.equal(
    canPharmacyProfilePerformAction('blocked', 'edit', 'pending'),
    false
  );

  assert.equal(canPharmacyProfilePerformAction('blocked', 'edit'), true);
});
