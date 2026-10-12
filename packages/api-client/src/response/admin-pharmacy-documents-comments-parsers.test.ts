import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminPharmacyCommentResponse,
  parseAdminPharmacyCommentsResponse,
  parseAdminPharmacyDocumentsResponse,
} from './admin-pharmacy-documents-comments-parsers';

//===================================================================

const id = '64b64b64b64b64b64b64b64b';

const document = {
  id,
  name: 'License.pdf',
  size: 1200,
  type: 'application/pdf',
  uploadedAt: '2026-10-12T10:30:00.000Z',
  source: 'pending',
};

const comment = {
  id,
  pharmacyId: id,
  text: 'Verify registration',
  createdAt: '2026-10-12T10:30:00.000Z',
  author: { userId: id, displayName: 'Admin' },
};

//===================================================================

test('document DTOs validate origin, metadata and never inject a private binary', () => {
  assert.deepEqual(
    parseAdminPharmacyDocumentsResponse({ documents: [document] }),
    { documents: [document] }
  );

  assert.throws(() =>
    parseAdminPharmacyDocumentsResponse({
      documents: [{ ...document, source: 'foreign' }],
    })
  );

  assert.throws(() =>
    parseAdminPharmacyDocumentsResponse({
      documents: [{ ...document, size: -1 }],
    })
  );

  assert.throws(() =>
    parseAdminPharmacyDocumentsResponse({
      documents: [{ ...document, id: 'invalid' }],
    })
  );

  assert.throws(() => parseAdminPharmacyDocumentsResponse({ documents: {} }));
});

//===================================================================

test('comment DTOs validate author, pharmacy and timestamps', () => {
  assert.deepEqual(
    parseAdminPharmacyCommentsResponse({ comments: [comment] }),
    { comments: [comment] }
  );

  assert.deepEqual(parseAdminPharmacyCommentResponse({ comment }), { comment });

  assert.throws(() =>
    parseAdminPharmacyCommentResponse({ comment: { ...comment, text: '' } })
  );

  assert.throws(() =>
    parseAdminPharmacyCommentsResponse({
      comments: [{ ...comment, pharmacyId: 'bad' }],
    })
  );

  assert.throws(() =>
    parseAdminPharmacyCommentResponse({
      comment: { ...comment, createdAt: 'yesterday' },
    })
  );
});
