import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { moderationReadyPharmacyFields } from './pharmacy-moderation-ready.helper';

//===============================================================

test('active moderation fixtures meet pharmacy model requirements', () => {
  const fixture = moderationReadyPharmacyFields({
    email: 'owner@example.com',
    phone: '+380501234567',
  });

  const pharmacy = new Pharmacy({
    ...fixture,
    ownerId: new Types.ObjectId(),
    name: 'Complete Test Pharmacy',
    status: 'active',
  });

  assert.equal(pharmacy.validateSync(), undefined);
  assert.ok(pharmacy.documents.length > 0);
  assert.ok(pharmacy.workingHours);
  assert.ok(pharmacy.bankDetails?.recipientName);
  assert.ok(pharmacy.location?.region);
});
