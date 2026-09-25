import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

//===================================================================

test('admin private comments reuse shared comment presentation and pagination UI', async () => {
  const source = await read('./AdminPrivateComments.tsx');

  assert.match(source, /CommentComposer/);
  assert.match(source, /CommentsList/);
  assert.match(source, /ConfirmationModal/);
  assert.match(source, /PaginationView/);
  assert.match(source, /clientRequestId/);
  assert.match(source, /globalThis\.crypto\?\.randomUUID/);
});

//===================================================================

test('admin private comments are loaded only when their profile tab mounts', async () => {
  const [profileSource, commentsSource] = await Promise.all([
    read('../AdminProfilePageContent/AdminProfilePageContent.tsx'),
    read('./AdminPrivateComments.tsx'),
  ]);

  assert.match(
    profileSource,
    /activeTab === COMMENTS_TAB \? <AdminPrivateComments \/> : null/
  );

  assert.match(
    commentsSource,
    /getMyAdminPrivateComments\(1, \{ signal: controller\.signal \}\)/
  );
});

//===================================================================

test('admin private comment BFF routes proxy only canonical self endpoints', async () => {
  const [collectionRoute, itemRoute] = await Promise.all([
    read('../../../app/api/admin/employees/me/comments/route.ts'),
    read('../../../app/api/admin/employees/me/comments/[commentId]/route.ts'),
  ]);

  assert.match(collectionRoute, /API_ROUTES\.admin\.employees\.myComments/);
  assert.match(collectionRoute, /export const GET/);
  assert.match(collectionRoute, /export const POST/);

  assert.match(
    itemRoute,
    /API_ROUTES\.admin\.employees\.myComment\(commentId\)/
  );

  assert.match(itemRoute, /export const DELETE/);
  assert.doesNotMatch(collectionRoute + itemRoute, /employeeId|targetUserId/);
});
