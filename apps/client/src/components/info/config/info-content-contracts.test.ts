import assert from 'node:assert/strict';
import test from 'node:test';

import { DELIVERY_PAYMENT_INFO } from './delivery-payment';
import { PERSONAL_DATA_NOTICE_INFO } from './personal-data-notice';
import { RETURN_POLICY_INFO } from './return-policy';
import type { InfoPageData } from './types';
import { USER_AGREEMENT_INFO } from './user-agreement';

//===================================================================

const DOCUMENTS: readonly InfoPageData[] = [
  DELIVERY_PAYMENT_INFO,
  PERSONAL_DATA_NOTICE_INFO,
  RETURN_POLICY_INFO,
  USER_AGREEMENT_INFO,
];

//===================================================================

const ISO_DATE_PATTERN = /^\d{4}-\d{2}(?:-\d{2})?$/;
const STABLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

//===================================================================

test('legal and information documents have unique paths and structured revision metadata', () => {
  assert.equal(
    new Set(DOCUMENTS.map((document) => document.path)).size,
    DOCUMENTS.length
  );

  for (const document of DOCUMENTS) {
    assert.match(document.metadata.updatedAt.iso, ISO_DATE_PATTERN);
    assert.ok(document.metadata.updatedAt.label.trim());
    assert.ok(document.metadata.version.trim());

    if (document.metadata.effectiveAt) {
      assert.match(document.metadata.effectiveAt.iso, ISO_DATE_PATTERN);
    }

    if (document.metadata.approvalStatus === 'approved') {
      assert.ok(document.metadata.contentOwner);
      assert.ok(document.metadata.legalEntity);
      assert.ok(document.metadata.reviewId);
    }
  }
});

//===================================================================

test('document anchors are explicit, stable, unique, and independent of visible titles', () => {
  for (const document of DOCUMENTS) {
    const ids = [
      ...(document.highlights ?? []).map((item) => item.id),
      ...document.sections.map((section) => section.id),
    ];

    assert.equal(new Set(ids).size, ids.length);

    for (const id of ids) assert.match(id, STABLE_ID_PATTERN);

    for (const section of document.sections) {
      assert.ok(section.title.trim());
      assert.ok(section.content.length > 0);
      for (const paragraph of section.content) assert.ok(paragraph.trim());
    }
  }
});
