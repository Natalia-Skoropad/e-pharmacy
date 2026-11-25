import assert from 'node:assert/strict';
import test from 'node:test';

import type { AdminAuditDetails } from './admin-audit';

import {
  getProductRequestAuditRows,
  getProductRequestAuditFieldLabels,
  getProductRequestAuditReason,
} from './product-request-audit-presentation';

import {
  getAdminAuditFieldLabel,
  getAdminAuditChangedFieldLabel,
  getAdminAuditFieldsSummary,
  getAuditColorSwatch,
} from './admin-audit-fields';

//===================================================================

test('human-readable audit fields retain developer-facing raw names separately', () => {
  assert.equal(
    getAdminAuditFieldLabel('createdByAdminUserId'),
    'Created by employee'
  );

  assert.equal(getAdminAuditFieldLabel('authorName'), 'Comment author');
  assert.equal(getAdminAuditFieldLabel('ownerUserId'), 'Pharmacy owner');

  assert.equal(
    getAdminAuditFieldLabel('documentMimeTypes'),
    'Document formats'
  );

  assert.equal(
    getAdminAuditFieldLabel('myNewAuditValue'),
    'My New Audit Value'
  );

  assert.equal(
    getAdminAuditFieldsSummary(['color', 'sortOrder']),
    'Category color, Display order'
  );
});

//===================================================================

test('only valid hex colors produce an audit swatch', () => {
  assert.equal(getAuditColorSwatch('#c2c89c'), '#c2c89c');
  assert.equal(getAuditColorSwatch('#abc'), '#abc');
  assert.equal(getAuditColorSwatch('159, 150, 34'), null);
  assert.equal(getAuditColorSwatch('javascript:alert(1)'), null);
  assert.equal(getAuditColorSwatch(99), null);
});

//===================================================================

test('audit change labels show tab context alongside original field identifiers', () => {
  assert.equal(
    getAdminAuditChangedFieldLabel('payment.recipientName', 'pharmacy'),
    'Recipient name (Payment details)'
  );

  assert.equal(
    getAdminAuditChangedFieldLabel('bankDetails.iban', 'pharmacy'),
    'IBAN (Payment details)'
  );

  assert.equal(
    getAdminAuditChangedFieldLabel('phone', 'pharmacy'),
    'Phone (Pharmacy data)'
  );

  assert.equal(
    getAdminAuditChangedFieldLabel('phone', 'pharmacyOwner'),
    'Phone number'
  );
});

//===================================================================

function requestAudit(
  overrides: Partial<AdminAuditDetails> = {}
): AdminAuditDetails {
  return {
    id: 'audit',
    actorUserId: 'owner',
    actorNameSnapshot: 'Owner',
    action: 'productRequest.updated',
    section: 'productRequests',
    entityType: 'productRequest',
    entityId: 'request',
    entityLabelSnapshot: 'Test product',
    requestId: 'trace',
    createdAt: '2026-11-25T12:00:00Z',
    changedFields: [],
    before: {},
    after: {},
    ...overrides,
  };
}

//===================================================================

test('product request creation presents the complete form in tab order, without technical fields', () => {
  const details = requestAudit({
    action: 'productRequest.created',
    changedFields: [
      'activeIngredientCount',
      'name',
      'status',
      'reviewState',
      'exists',
      'categoryMode',
      'categoryId',
      'productId',
      'cancelledBy',
      'productImageFingerprint',
      'rejectionReason',
    ],

    before: { exists: false },

    after: {
      exists: true,
      name: 'W'.repeat(160),
      status: 'new',
      categoryMode: 'catalog',
      categoryId: null,
      productImageFingerprint: null,
      reviewState: null,
      rejectionReason: null,
    },
  });

  const rows = getProductRequestAuditRows(details);

  assert.deepEqual(
    rows.map((row) => row.label),
    [
      'Product image (Product data)',
      'Product name (Product data)',
      'Product article (Product data)',
      'Category (Product data)',
      'Other category (Product data)',
      'Brand (Characteristics)',
      'Series / Line (Characteristics)',
      'Manufacturer (Characteristics)',
      'Release form (Characteristics)',
      'Active ingredients (Characteristics)',
      'Active ingredient count (Characteristics)',
      'About product (About product)',
      'Pharmacy note for Admin (Note for Admin)',
      'Files and documents (Documents)',
      'Status',
    ]
  );

  assert.deepEqual(
    getProductRequestAuditFieldLabels(details),
    rows.map((row) => row.label)
  );

  assert.deepEqual(
    rows.map((row) => row.developerField),
    [
      'productImageName',
      'name',
      'article',
      'categoryId',
      'customCategory',
      'brand',
      'series',
      'manufacturer',
      'releaseForm',
      'activeIngredients',
      'activeIngredientCount',
      'fullDescription',
      'pharmacyComment',
      'additionalFiles',
      'status',
    ]
  );

  assert.equal(new Set(rows.map((row) => row.field)).size, 15);
  assert.ok(rows.every((row) => row.before === null));
  assert.equal(rows.find((row) => row.field === 'category')?.after, null);

  assert.equal(
    rows.find((row) => row.field === 'name')?.after,
    'W'.repeat(160)
  );

  assert.equal(rows.at(-1)?.afterStatus?.value, 'new');
  assert.equal(getProductRequestAuditReason(details), undefined);
});

//===================================================================

test('product request edits group only affected fields and use saved category names', () => {
  const details = requestAudit({
    changedFields: [
      'series',
      'categoryId',
      'categoryMode',
      'customCategory',
      'name',
      'productId',
      'exists',
    ],

    before: {
      categoryMode: 'catalog',
      categoryId: 'id-a',
      categoryName: 'Vitamins',
      name: 'Old',
      series: 'Old series',
    },

    after: {
      categoryMode: 'custom',
      categoryId: null,
      customCategory: 'New category',
      name: 'New',
      series: 'New series',
    },
  });

  const rows = getProductRequestAuditRows(details);

  assert.deepEqual(
    rows.map((row) => row.label),
    [
      'Product name (Product data)',
      'Category (Product data)',
      'Other category (Product data)',
      'Series / Line (Characteristics)',
    ]
  );

  assert.deepEqual(
    [rows[1].before, rows[1].after],
    ['Vitamins', 'Other category']
  );

  assert.equal(rows[2].after, 'New category');

  assert.equal(
    getProductRequestAuditRows(
      requestAudit({
        changedFields: ['categoryId'],
        after: { categoryId: 'legacy-id' },
      })
    )[0].after,
    'Category name not recorded'
  );
});

//===================================================================

test('photo and document metadata is readable without hashes; same-name replacements remain visible', () => {
  const details = requestAudit({
    changedFields: [
      'productImageName',
      'productImageFingerprint',
      'additionalFiles',
      'fullDescription',
    ],

    before: {
      productImageName: 'photo.webp',
      productImageFingerprint: 'a'.repeat(64),
      additionalFiles: [
        `file.pdf (application/pdf, 10 bytes) ${'a'.repeat(24)}`,
      ],
    },

    after: {
      productImageName: 'photo.webp',
      productImageFingerprint: 'b'.repeat(64),

      additionalFiles: [
        `file.pdf (application/pdf, 10 bytes) ${'b'.repeat(24)}`,
      ],

      fullDescription: ['First chunk', ' second chunk'],
    },
  });

  const rows = getProductRequestAuditRows(details);

  assert.equal(rows.length, 3);
  assert.equal(rows[0].after, 'photo.webp (image changed)');
  assert.equal(rows[1].after, 'First chunk second chunk');
  assert.deepEqual(rows[2].before, ['file.pdf (application/pdf, 10 bytes)']);

  assert.deepEqual(rows[2].after, [
    'file.pdf (application/pdf, 10 bytes)',
    'Document contents or references changed',
  ]);
});

//===================================================================

test('moderation combines status, review state and cancellation; reasons stay separate', () => {
  const details = requestAudit({
    action: 'productRequest.status.changed',
    changedFields: ['status', 'reviewState', 'cancelledBy', 'rejectionReason'],
    before: { status: 'on_moderation', reviewState: 'changes_requested' },

    after: {
      status: 'rejected',
      reviewState: null,
      cancelledBy: 'owner',
      rejectionReason: 'Cancelled by owner',
    },
  });

  const rows = getProductRequestAuditRows(details);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].beforeStatus?.needsChanges, true);
  assert.equal(rows[0].afterStatus?.cancellation, 'owner');
  assert.equal(getProductRequestAuditReason(details), 'Cancelled by owner');

  const correction = requestAudit({
    action: 'productRequest.status.changed',
    changedFields: ['reviewState', 'rejectionReason'],
    before: { status: 'on_moderation' },

    after: {
      status: 'on_moderation',
      reviewState: 'changes_requested',
      rejectionReason: 'Correct description',
    },
  });

  const row = getProductRequestAuditRows(correction)[0];

  assert.equal(row.beforeStatus?.needsChanges, false);
  assert.equal(row.afterStatus?.needsChanges, true);
  assert.equal(getProductRequestAuditReason(correction), 'Correct description');

  assert.equal(
    getProductRequestAuditReason(
      requestAudit({
        action: 'productRequest.status.changed',
        changedFields: ['rejectionReason'],
        before: { rejectionReason: 'Old' },
        after: { rejectionReason: null },
      })
    ),
    undefined
  );
});
