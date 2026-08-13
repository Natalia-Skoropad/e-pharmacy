import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

//===================================================================

test('verification document content has owner/admin-only route boundaries', () => {
  const pharmacyRoutes = read('src/routes/pharmacy.routes.ts');
  const adminRoutes = read('src/routes/admin.routes.ts');
  const service = read('src/services/pharmacy-document.service.ts');

  assert.match(
    pharmacyRoutes,
    /'\/me\/documents\/:documentId'[\s\S]*authenticate[\s\S]*authorizeRoles\(USER_ROLES\.PHARMACY\)/
  );

  assert.match(
    adminRoutes,
    /adminRoutes\.use\(authenticate, authorizeRoles\(USER_ROLES\.ADMIN\)\)/
  );

  assert.match(
    adminRoutes,
    /'\/pharmacies\/:pharmacyId\/documents\/:documentId'/
  );

  assert.match(service, /pharmacyId:\s*pharmacy\._id/);
  assert.match(service, /attachedAt:\s*\{ \$exists: true \}/);

  assert.doesNotMatch(
    pharmacyRoutes,
    /pharmacyRoutes\.get\(\s*'\/:pharmacyId\/documents/,
    'No anonymous/public pharmacy document content route may exist.'
  );
});
