import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = readFileSync(
  new URL('./AdminAuthorizationProvider.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('authorization provider blocks shell rendering until current access is known', () => {
  assert.match(source, /Checking admin permissions/);
  assert.match(source, /getCurrentAdminAccess/);
  assert.match(source, /ADMIN_ACCESS_ERROR_CODES\.ACCESS_REVOKED/);
  assert.match(source, /Admin access has been revoked/);
  assert.match(source, /Admin access is unavailable/);
  assert.match(source, /We could not verify admin permissions/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|positionId/);
});
