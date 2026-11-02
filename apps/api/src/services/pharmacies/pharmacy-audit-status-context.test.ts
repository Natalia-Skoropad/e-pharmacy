import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePharmacyAuditStatusContext } from './pharmacy-audit-status-context';

//===================================================================

test('legacy verification resubmission has On verification on both sides', () => {
  assert.deepEqual(
    resolvePharmacyAuditStatusContext({
      action: 'pharmacy.moderation.submitted',
      before: { reviewState: 'changes_requested' },
      after: { reviewState: 'pending' },
    }),
    { previousStatus: 'on_verification', nextStatus: 'on_verification' }
  );
});

//===================================================================

test('explicit status context takes precedence over the historical fallback', () => {
  assert.deepEqual(
    resolvePharmacyAuditStatusContext({
      action: 'pharmacy.moderation.submitted',
      before: { status: 'on_moderation', reviewState: 'changes_requested' },
      after: { status: 'on_moderation', reviewState: 'pending' },
    }),
    { previousStatus: 'on_moderation', nextStatus: 'on_moderation' }
  );
});

//===================================================================

test('a real status change never invents a missing before status', () => {
  assert.deepEqual(
    resolvePharmacyAuditStatusContext({
      action: 'pharmacy.created',
      before: {},
      after: { status: 'new' },
    }),
    { previousStatus: null, nextStatus: 'new' }
  );
});

//===================================================================

test('corrections requested from verification display unchanged status', () => {
  assert.deepEqual(
    resolvePharmacyAuditStatusContext({
      action: 'pharmacy.corrections.requested',
      before: { reviewState: 'pending' },
      after: { reviewState: 'changes_requested' },
    }),
    { previousStatus: 'on_verification', nextStatus: 'on_verification' }
  );
});

//===================================================================

test('cancellation keeps the real On verification -> New transition', () => {
  assert.deepEqual(
    resolvePharmacyAuditStatusContext({
      action: 'pharmacy.verification.withdrawn',
      before: { status: 'on_verification', reviewState: 'changes_requested' },
      after: { status: 'new', reviewState: null },
    }),
    { previousStatus: 'on_verification', nextStatus: 'new' }
  );
});
