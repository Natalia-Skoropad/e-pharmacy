import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  PHARMACY_PROFILE_ACTIONS_BY_STATUS,
  canPharmacyProfilePerformAction,
} from '../constants/pharmacy-profile';

import { canPharmacyMembershipUseProfileCapability } from './pharmacy-membership.service';

//===================================================================

const EXPECTED_TRANSITIONS = {
  new: ['edit', 'submit_for_verification'],
  on_verification: [],
  on_moderation: [],
  active: ['edit', 'submit_for_moderation'],
  blocked: [],
} as const;

//===================================================================

test('backend pharmacy profile transition graph is explicit for every status', () => {
  assert.deepEqual(PHARMACY_PROFILE_ACTIONS_BY_STATUS, EXPECTED_TRANSITIONS);

  for (const [status, actions] of Object.entries(EXPECTED_TRANSITIONS)) {
    for (const action of [
      'edit',
      'submit_for_verification',
      'submit_for_moderation',
    ] as const) {
      assert.equal(
        canPharmacyProfilePerformAction(
          status as keyof typeof EXPECTED_TRANSITIONS,
          action
        ),
        (actions as readonly string[]).includes(action)
      );
    }
  }
});

//===================================================================

test('owner and manager pharmacy-profile capabilities follow least privilege', () => {
  for (const capability of [
    'read_profile',
    'edit_profile',
    'manage_documents',
    'submit_profile',
  ] as const) {
    assert.equal(
      canPharmacyMembershipUseProfileCapability('owner', capability),
      true
    );
  }

  assert.equal(
    canPharmacyMembershipUseProfileCapability('manager', 'read_profile'),
    true
  );

  for (const capability of [
    'edit_profile',
    'manage_documents',
    'submit_profile',
  ] as const) {
    assert.equal(
      canPharmacyMembershipUseProfileCapability('manager', capability),
      false
    );
  }
});

//===================================================================

test('profile and document services enforce the membership capability matrix', async () => {
  const [profileService, documentService] = await Promise.all([
    readFile(resolve(process.cwd(), 'src/services/pharmacy.service.ts'), 'utf8'),
    readFile(
      resolve(process.cwd(), 'src/services/pharmacy-document.service.ts'),
      'utf8'
    ),
  ]);

  assert.match(
    profileService,
    /findPharmacyForProfileAccess\(\s*userId,\s*'read_profile'\s*\)/
  );

  assert.match(
    profileService,
    /findPharmacyForProfileAccess\(\s*userId,\s*'edit_profile'\s*\)/
  );

  assert.match(
    profileService,
    /findPharmacyForProfileAccess\(\s*userId,\s*'submit_profile'\s*\)/
  );

  assert.match(
    documentService,
    /findPharmacyForProfileAccess\(\s*userId,\s*'manage_documents'\s*\)/
  );
});
