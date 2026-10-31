import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPharmacyAuditChanges } from './pharmacy-audit-changes';

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

test('status submission contains status and reviewState changes instead of a revision', () => {
  const after = {
    ...pharmacy,
    status: 'on_moderation',
    reviewState: 'pending',
  } as Parameters<typeof buildPharmacyAuditChanges>[1];

  const result = buildPharmacyAuditChanges(pharmacy, after, 'Submitted');

  assert.deepEqual(result.changedFields, ['status', 'reviewState']);
  assert.equal(result.before.status, 'active');
  assert.equal(result.after.status, 'on_moderation');
});

//===============================================================

test('unchanged moderation actions keep a neutral event instead of a fabricated field', () => {
  const result = buildPharmacyAuditChanges(pharmacy, pharmacy, 'Reviewed');

  assert.deepEqual(result.changedFields, ['event']);
  assert.equal(result.before.event, 'Reviewed');
});
