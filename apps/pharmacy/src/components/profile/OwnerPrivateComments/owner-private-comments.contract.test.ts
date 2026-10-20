import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const comments = read('./OwnerPrivateComments.tsx');

const clientApi = read(
  '../../../lib/api/browser/pharmacy-user-private-comments.api.ts'
);

const server = read(
  '../../../../../api/src/services/pharmacy-user-private-note.service.ts'
);

//===================================================================

test('private comments use only signed-in user API and shared comment UI', () => {
  assert.match(comments, /getMyPharmacyUserPrivateComments/);
  assert.match(comments, /createMyPharmacyUserPrivateComment/);
  assert.match(comments, /deleteMyPharmacyUserPrivateComment/);
  assert.match(comments, /<CommentsList/);
  assert.match(comments, /<CommentComposer/);
  assert.match(comments, /<PaginationView/);
  assert.match(comments, /<ConfirmationModal/);
  assert.match(clientApi, /PHARMACY_API_ROUTES\.pharmacyOwners\.myComments/);

  assert.doesNotMatch(
    comments + clientApi,
    /getPharmacyNotes\(|\/api\/pharmacy-notes/
  );
});

//===================================================================

test('private comments preserve one idempotent request ID for retries and abort obsolete requests', () => {
  assert.match(comments, /globalThis\.crypto\?\.randomUUID/);
  assert.match(comments, /clientRequestId: createCommentRequestId\(\)/);
  assert.match(comments, /existingRequest\?\.text === text/);
  assert.match(comments, /activeLoadControllerRef\.current\?\.abort\(\)/);
  assert.match(comments, /activeCreateControllerRef\.current\?\.abort\(\)/);
  assert.match(comments, /activeDeleteControllerRef\.current\?\.abort\(\)/);
  assert.match(server, /ownerUserId: userId/);

  assert.match(
    server,
    /PharmacyUserPrivateNote\.findOneAndDelete\(\{[\s\S]*?ownerUserId: userId/
  );
});
