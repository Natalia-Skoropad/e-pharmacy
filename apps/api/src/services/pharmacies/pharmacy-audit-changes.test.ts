import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPharmacyAuditChanges,
  getPharmacyAuditPhotoSource,
} from './pharmacy-audit-changes';

//===================================================================

const pharmacy = {
  name: 'Pharmacy Artsyz',
  phone: '+380501111111',
  email: 'owner@example.com',

  location: {
    address: 'Central 1',
    settlement: 'Artsyz',
    region: 'Odesa',
    countryCode: 'UA',
  },

  imageUrl: null,
  description: 'Open all week',
  shortDescription: 'Pharmacy',
  workingHours: 'Mon-Fri: 09:00-18:00',

  bankDetails: {
    recipientName: 'Pharmacy Artsyz',
    taxId: '1235789254',
    iban: 'UA300001000000000000000000125',
    bankName: 'Bank',
    receiptEmail: 'receipt@example.com',
    paymentPurpose: 'Invoice',
  },

  documents: [],
  status: 'active',
  reviewState: null,
  reviewFeedback: null,
  blockSource: null,
  statusReason: null,
  pendingModeration: undefined,
} as unknown as Parameters<typeof buildPharmacyAuditChanges>[0];

//===================================================================

test('proposed payment changes include the exact field values before and after', () => {
  const after = {
    ...pharmacy,

    pendingModeration: {
      bankDetails: {
        recipientName: 'Pharmacy Artsyz 1',
        taxId: '1235789255',
        iban: 'UA300001000000000000000000126',
      },
    },
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const result = buildPharmacyAuditChanges(pharmacy, after, 'Profile updated');

  assert.deepEqual(result.changedFields, [
    'payment.recipientName',
    'payment.taxId',
    'payment.iban',
  ]);

  assert.equal(result.before['payment.recipientName'], 'Pharmacy Artsyz');
  assert.equal(result.after['payment.recipientName'], 'Pharmacy Artsyz 1');
  assert.equal(result.before['payment.iban'], 'UA300001000000000000000000125');
  assert.equal(result.after['payment.iban'], 'UA300001000000000000000000126');
  assert.ok(!result.changedFields.includes('revision'));
  assert.ok(!result.changedFields.includes('editedSections'));
});

//===============================================================

test('status submission has one reviewState transition with status context', () => {
  const after = {
    ...pharmacy,
    status: 'on_moderation',
    reviewState: 'pending',
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const result = buildPharmacyAuditChanges(pharmacy, after, 'Submitted');

  assert.deepEqual(result.changedFields, ['reviewState']);
  assert.equal(result.before.status, 'active');
  assert.equal(result.after.status, 'on_moderation');
});

//===============================================================

test('unchanged moderation actions keep a neutral event instead of a fabricated field', () => {
  const result = buildPharmacyAuditChanges(pharmacy, pharmacy, 'Reviewed');

  assert.deepEqual(result.changedFields, ['event']);
  assert.equal(result.before.event, 'Reviewed');
});

//===============================================================

test('owner cancellation shows On verification + Needs changes → New once', () => {
  const before = {
    ...pharmacy,
    status: 'on_verification',
    reviewState: 'changes_requested',
    reviewFeedback: 'Previous administrator feedback',
  } as Parameters<typeof buildPharmacyAuditChanges>[0];

  const after = {
    ...before,
    status: 'new',
    reviewState: null,
    reviewFeedback: null,
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const result = buildPharmacyAuditChanges(
    before,
    after,
    'pharmacy.verification.withdrawn: status, reviewState'
  );

  assert.deepEqual(result.changedFields, ['reviewState']);
  assert.equal(result.before.status, 'on_verification');
  assert.equal(result.after.status, 'new');
  assert.equal(result.before.reviewState, 'changes_requested');
  assert.equal(result.after.reviewState, null);
  assert.ok(!result.changedFields.includes('reviewFeedback'));
});

//===================================================================

test('second corrections request is a same-status transition and records new feedback', () => {
  const submitted = {
    ...pharmacy,
    status: 'on_verification',
    reviewState: 'pending',
    reviewFeedback: null,
  } as Parameters<typeof buildPharmacyAuditChanges>[0];

  const corrected = {
    ...submitted,
    reviewState: 'changes_requested',
    reviewFeedback: 'Please replace the pharmacy documents.',
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const result = buildPharmacyAuditChanges(
    submitted,
    corrected,
    'request_corrections'
  );

  assert.deepEqual(result.changedFields, ['reviewState', 'reviewFeedback']);
  assert.equal(result.before.status, 'on_verification');
  assert.equal(result.after.status, 'on_verification');
  assert.equal(result.before.reviewState, 'pending');
  assert.equal(result.after.reviewState, 'changes_requested');

  assert.equal(
    result.after.reviewFeedback,
    'Please replace the pharmacy documents.'
  );
});

//===================================================================

test('owner resubmission clears old feedback without reporting it as a new change', () => {
  const before = {
    ...pharmacy,
    status: 'on_verification',
    reviewState: 'changes_requested',
    reviewFeedback: 'Please replace the pharmacy documents.',
  } as Parameters<typeof buildPharmacyAuditChanges>[0];

  const after = {
    ...before,
    reviewState: 'pending',
    reviewFeedback: null,
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const result = buildPharmacyAuditChanges(
    before,
    after,
    'pharmacy.moderation.submitted: verificationSubmission'
  );

  assert.deepEqual(result.changedFields, ['reviewState']);
  assert.equal(result.before.status, 'on_verification');
  assert.equal(result.after.status, 'on_verification');
  assert.equal(result.before.reviewState, 'changes_requested');
  assert.equal(result.after.reviewState, 'pending');
});

//===================================================================

test('owner resubmission of corrections for On moderation is one review-state transition', () => {
  const returned = {
    ...pharmacy,
    status: 'on_moderation',
    reviewState: 'changes_requested',
    reviewFeedback: 'Replace the incorrect pharmacy documents.',
    pendingModeration: { name: 'Updated Pharmacy Artsyz' },
  } as Parameters<typeof buildPharmacyAuditChanges>[0];

  const resubmitted = {
    ...returned,
    reviewState: 'pending',
    reviewFeedback: null,
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const audit = buildPharmacyAuditChanges(
    returned,
    resubmitted,
    'pharmacy.moderation.submitted: name'
  );

  assert.deepEqual(audit.changedFields, ['reviewState']);
  assert.equal(audit.before.status, 'on_moderation');
  assert.equal(audit.after.status, 'on_moderation');
  assert.equal(audit.before.reviewState, 'changes_requested');
  assert.equal(audit.after.reviewState, 'pending');
  assert.ok(!audit.changedFields.includes('reviewFeedback'));
});

//===============================================================

test('photo audit captures the pre-change and submitted images without copying bytes into the audit log', () => {
  const before = {
    ...pharmacy,
    imageUrl: 'data:image/png;base64,QUJD',
  } as Parameters<typeof buildPharmacyAuditChanges>[0];

  const after = {
    ...before,
    pendingModeration: { imageUrl: 'data:image/png;base64,REVG' },
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const audit = buildPharmacyAuditChanges(before, after, 'Profile updated');

  assert.ok(audit.changedFields.includes('photoFingerprint'));
  assert.equal(audit.before.photoPreviewUrl, null);
  assert.equal(audit.after.photoPreviewUrl, null);
  assert.equal(getPharmacyAuditPhotoSource(before), before.imageUrl);

  assert.equal(
    getPharmacyAuditPhotoSource(after),
    after.pendingModeration?.imageUrl
  );

  assert.ok(!JSON.stringify(audit).includes('base64'));
});
