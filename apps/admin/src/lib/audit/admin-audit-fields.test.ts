import assert from 'node:assert/strict';
import test from 'node:test';

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
