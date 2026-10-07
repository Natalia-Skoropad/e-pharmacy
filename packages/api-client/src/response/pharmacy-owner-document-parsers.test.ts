import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parsePharmacyOwnerDocumentResponse,
  parsePharmacyOwnerDocumentsResponse,
} from './pharmacy-owner-document-parsers';

//===================================================================

const document = {
  id: '64b64b64b64b64b64b64b64b',
  name: 'license.pdf',
  size: 1024,
  type: 'application/pdf',
  uploadedAt: '2026-10-07T00:00:00.000Z',
  updatedAt: '2026-10-07T00:00:00.000Z',
};

//===================================================================

test('parses owner document metadata without binary fingerprints', () => {
  assert.deepEqual(
    parsePharmacyOwnerDocumentsResponse({ documents: [document] }),
    {
      documents: [document],
    }
  );

  assert.deepEqual(parsePharmacyOwnerDocumentResponse({ document }), {
    document,
  });
});

//===================================================================

test('fails closed for malformed owner document payloads', () => {
  assert.throws(
    () =>
      parsePharmacyOwnerDocumentResponse({
        document: { ...document, size: '1024' },
      }),
    /size/i
  );

  assert.throws(
    () => parsePharmacyOwnerDocumentsResponse({ documents: {} }),
    /array/i
  );
});
