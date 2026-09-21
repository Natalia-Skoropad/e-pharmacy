import assert from 'node:assert/strict';
import test from 'node:test';

import { PHARMACY_STATUSES } from './auth';
import {
  PHARMACY_OPERATIONAL_STATUSES,
  isPharmacyOperationalStatus,
} from './pharmacy-status';

//===================================================================

test('operational pharmacy status contract is active plus on_moderation only', () => {
  assert.deepEqual(PHARMACY_OPERATIONAL_STATUSES, [
    PHARMACY_STATUSES.ACTIVE,
    PHARMACY_STATUSES.ON_MODERATION,
  ]);

  assert.equal(isPharmacyOperationalStatus(PHARMACY_STATUSES.ACTIVE), true);

  assert.equal(
    isPharmacyOperationalStatus(PHARMACY_STATUSES.ON_MODERATION),
    true
  );

  assert.equal(isPharmacyOperationalStatus(PHARMACY_STATUSES.NEW), false);

  assert.equal(
    isPharmacyOperationalStatus(PHARMACY_STATUSES.ON_VERIFICATION),
    false
  );

  assert.equal(isPharmacyOperationalStatus(PHARMACY_STATUSES.BLOCKED), false);
});
