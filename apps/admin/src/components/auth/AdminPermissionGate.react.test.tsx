import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = readFileSync(
  new URL('./AdminPermissionGate.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('permission gate delegates authorization to the canonical admin helper', () => {
  assert.match(source, /useAdminAuthorization/);
  assert.match(source, /canAdmin\(access, permission\)/);
  assert.match(source, /Permission required/);

  assert.doesNotMatch(
    source,
    /user\.role|position|localStorage|sessionStorage/
  );
});
