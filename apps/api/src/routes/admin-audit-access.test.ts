import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

//===============================================================

const ROOT_DIR = path.resolve(process.cwd(), 'src');

//===============================================================

test('admin audit read routes require audit.view and expose no mutation route', async () => {
  const source = await readFile(
    path.join(ROOT_DIR, 'routes', 'admin.routes.ts'),
    'utf8'
  );

  assert.match(
    source,
    /get\(\s*['"]\/audit['"][\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.audit\.view\)/
  );

  assert.match(
    source,
    /get\(\s*['"]\/audit\/:auditLogId['"][\s\S]*?requireAdminPermission\(ADMIN_PERMISSIONS\.audit\.view\)/
  );

  assert.doesNotMatch(source, /\.(?:post|patch|put|delete)\(\s*['"]\/audit/);
  assert.doesNotMatch(source, /post\(\s*['"]\/pharmacies['"]/);
});
