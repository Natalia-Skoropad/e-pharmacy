import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminEmployeeDocumentResponse,
  parseAdminEmployeeDocumentsResponse,
} from './admin-employee-documents';

//===================================================================

const document = {
  id: '507f1f77bcf86cd799439011',
  name: 'policy.pdf',
  size: 2048,
  type: 'application/pdf',
  uploadedAt: '2026-09-24T10:00:00.000Z',
  updatedAt: '2026-09-24T10:05:00.000Z',
};

//===================================================================

test('admin document parsers accept the canonical metadata-only contract', () => {
  assert.deepEqual(
    parseAdminEmployeeDocumentsResponse({ documents: [document] }),
    {
      documents: [document],
    }
  );

  assert.deepEqual(parseAdminEmployeeDocumentResponse({ document }), {
    document,
  });
});

//===================================================================

test('admin document parsers fail closed for malformed metadata', () => {
  assert.throws(
    () =>
      parseAdminEmployeeDocumentResponse({
        document: { ...document, size: 0 },
      }),
    /invalid admin document/i
  );

  assert.throws(
    () =>
      parseAdminEmployeeDocumentsResponse({
        documents: [{ ...document, uploadedAt: 'not-a-date' }],
      }),
    /invalid uploadedAt/i
  );
});
