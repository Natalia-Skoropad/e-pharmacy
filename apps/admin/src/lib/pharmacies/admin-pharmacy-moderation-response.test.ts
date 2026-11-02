import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAdminPharmacyModerationResponse } from './admin-pharmacy-moderation-response';

//===================================================================

const ID = '6ae661e459b5a5c23f03da30';
const REV = '2026-11-01T12:40:00.000Z';

//===================================================================

test('admin decision accepts the server DTO without owner membershipRole', () => {
  const result = parseAdminPharmacyModerationResponse({
    pharmacy: {
      id: ID,
      status: 'on_verification',
      updatedAt: REV,
      reviewState: 'changes_requested',
      reviewFeedback: 'You sent the wrong documents.',
      name: 'Pharmacy Izmail',
      bankTransferAvailable: true,
      documents: [],
      rating: 0,
      reviewsCount: 0,
    },
  });

  assert.deepEqual(result, {
    pharmacy: {
      id: ID,
      status: 'on_verification',
      updatedAt: REV,
      reviewState: 'changes_requested',
      reviewFeedback: 'You sent the wrong documents.',
    },
  });
});

//===================================================================

test('admin response parser supports approval without reviewState', () => {
  assert.equal(
    parseAdminPharmacyModerationResponse({
      pharmacy: { id: ID, status: 'active', updatedAt: REV },
    }).pharmacy.status,
    'active'
  );
});

//===================================================================

test('admin response parser rejects malformed or incomplete decision results', () => {
  for (const value of [
    null,
    {},
    { pharmacy: null },
    { pharmacy: { id: ID, status: 'nonsense', updatedAt: REV } },
    { pharmacy: { id: 'bad', status: 'active', updatedAt: REV } },
    { pharmacy: { id: ID, status: 'active', updatedAt: 'not-a-date' } },
    {
      pharmacy: {
        id: ID,
        status: 'active',
        updatedAt: REV,
        reviewState: 'invalid',
      },
    },
  ]) {
    assert.throws(() => parseAdminPharmacyModerationResponse(value));
  }
});
