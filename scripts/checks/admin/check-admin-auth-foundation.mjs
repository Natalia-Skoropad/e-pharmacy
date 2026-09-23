import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_FILE = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(CURRENT_FILE), '..', '..', '..');

const read = (...segments) =>
  readFile(path.join(ROOT_DIR, ...segments), 'utf8');

const exists = async (...segments) => {
  try {
    await access(path.join(ROOT_DIR, ...segments));
    return true;
  } catch {
    return false;
  }
};

//===================================================================

const payloads = await read('packages', 'types', 'src', 'auth', 'payloads.ts');
assert.match(payloads, /application:\s*AuthApplication/);
assert.doesNotMatch(payloads, /application:\s*Extract<AuthApplication/);

assert.match(
  payloads,
  /role\?:\s*Extract<UserRole,\s*'client'\s*\|\s*'pharmacy'>/
);

const schema = await read('apps', 'api', 'src', 'schemas', 'auth.schema.ts');

for (const value of ['CLIENT', 'PHARMACY', 'ADMIN']) {
  assert.match(
    schema,
    new RegExp(`loginSchema[\\s\\S]*?AUTH_APPLICATIONS\\.${value}`)
  );
  assert.match(
    schema,
    new RegExp(`forgotPasswordSchema[\\s\\S]*?AUTH_APPLICATIONS\\.${value}`)
  );
}

const registerBlock = schema.slice(
  schema.indexOf('export const registerSchema'),
  schema.indexOf('export const createPharmacyUserSchema')
);

assert.match(registerBlock, /USER_ROLES\.CLIENT/);
assert.match(registerBlock, /USER_ROLES\.PHARMACY/);
assert.doesNotMatch(registerBlock, /USER_ROLES\.ADMIN/);

const authService = await read(
  'apps',
  'api',
  'src',
  'services',
  'auth.service.ts'
);

assert.match(authService, /resolvePasswordResetAppUrl/);
assert.match(authService, /admin:\s*env\.ADMIN_APP_URL/);

const passwordResetRouting = await read(
  'apps',
  'api',
  'src',
  'utils',
  'password-reset-app-url.ts'
);

assert.match(passwordResetRouting, /admin:\s*urls\.admin/);

assert.doesNotMatch(
  passwordResetRouting,
  /admin:\s*urls\.admin\s*\|\|\s*urls\.client/
);

const bootstrapScript = await read(
  'apps',
  'api',
  'src',
  'scripts',
  'seed-admin-owner.ts'
);

assert.match(bootstrapScript, /USER_ROLES\.ADMIN/);
assert.match(bootstrapScript, /USER_STATUSES\.ACTIVE/);
assert.match(bootstrapScript, /hashPassword\(input\.password\)/);

assert.doesNotMatch(
  bootstrapScript,
  /Router|express|app\.(?:post|put|patch|get|delete)\(/
);

assert.doesNotMatch(
  bootstrapScript,
  /console\.(?:log|error)\([^\n]*(?:input\.password|ADMIN_OWNER_PASSWORD)/
);

assert.match(bootstrapScript, /Invalid ADMIN_OWNER_\* bootstrap configuration/);

const apiPackage = JSON.parse(await read('apps', 'api', 'package.json'));

assert.equal(
  apiPackage.scripts['seed:admin-owner'],
  'node ../../scripts/dev/run-with-bff-secret.mjs tsx src/scripts/seed-admin-owner.ts'
);

const rootPackage = JSON.parse(await read('package.json'));

assert.equal(
  rootPackage.scripts['seed:admin-owner'],
  'pnpm --filter @e-pharmacy/api seed:admin-owner'
);

assert.match(rootPackage.scripts['check:admin'], /check:admin-auth-foundation/);

assert.match(
  rootPackage.scripts['check:before-deploy'],
  /check:admin-auth-foundation/
);

assert.equal(
  await exists('apps', 'admin', 'src', 'app', 'register', 'page.tsx'),
  false,
  'Admin public registration page must not exist'
);

assert.equal(
  await exists(
    'apps',
    'admin',
    'src',
    'app',
    'api',
    'auth',
    'register',
    'route.ts'
  ),
  false,
  'Admin public registration BFF route must not exist'
);

console.log('Admin auth foundation structural check passed.');
