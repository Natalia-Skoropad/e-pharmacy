import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

//===================================================================

async function readSource(...segments) {
  return readFile(path.join(ROOT_DIR, ...segments), 'utf8');
}

//===================================================================

function extractQuotedValues(source, constName, opening, closing) {
  const pattern = new RegExp(
    `export\\s+const\\s+${constName}\\s*=\\s*\\${opening}([\\s\\S]*?)\\${closing}\\s*as\\s+const`
  );
  const match = source.match(pattern);

  assert.ok(match, `Could not read ${constName}`);

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(
    (valueMatch) => valueMatch[1]
  );
}

//===================================================================

function extractArrayValues(source, constName) {
  return extractQuotedValues(source, constName, '[', ']');
}

//===================================================================

function extractObjectValues(source, constName) {
  return extractQuotedValues(source, constName, '{', '}');
}

//===================================================================

function extractNumber(source, constName) {
  const pattern = new RegExp(`export\\s+const\\s+${constName}\\s*=\\s*(\\d+)`);
  const match = source.match(pattern);

  assert.ok(match, `Could not read ${constName}`);

  return Number(match[1]);
}

//===================================================================

function assertSameValues(label, frontendValues, backendValues) {
  assert.deepEqual(
    [...backendValues].sort(),
    [...frontendValues].sort(),
    `${label} differ between frontend and backend`
  );
}

//===================================================================

const [
  frontendAuth,
  backendAuth,
  frontendCategories,
  backendCategories,
  frontendRequestStatuses,
  backendRequestStatuses,
  frontendCart,
  backendCart,
] = await Promise.all([
  readSource('packages', 'config', 'src', 'auth', 'domain-values.ts'),
  readSource('apps', 'api', 'src', 'constants', 'auth.ts'),
  readSource('packages', 'config', 'src', 'products', 'categories.ts'),
  readSource('apps', 'api', 'src', 'types', 'categories.ts'),

  readSource('packages', 'config', 'src', 'product-requests', 'statuses.ts'),

  readSource(
    'apps',
    'api',
    'src',
    'constants',
    'product-request-validation.ts'
  ),

  readSource('packages', 'config', 'src', 'cart', 'cart-constants.ts'),
  readSource('apps', 'api', 'src', 'constants', 'cart.ts'),
]);

//===================================================================

assertSameValues(
  'Auth applications',
  extractArrayValues(frontendAuth, 'AUTH_APPLICATIONS'),
  extractObjectValues(backendAuth, 'AUTH_APPLICATIONS')
);

//===================================================================

assertSameValues(
  'User roles',
  extractArrayValues(frontendAuth, 'USER_ROLES'),
  extractObjectValues(backendAuth, 'USER_ROLES')
);

//===================================================================

assertSameValues(
  'Product categories',
  extractArrayValues(frontendCategories, 'PRODUCT_CATEGORIES'),
  extractArrayValues(backendCategories, 'PRODUCT_CATEGORIES')
);

//===================================================================

assertSameValues(
  'Product request statuses',
  extractArrayValues(frontendRequestStatuses, 'PRODUCT_REQUEST_STATUSES'),
  extractArrayValues(backendRequestStatuses, 'PRODUCT_REQUEST_STATUSES')
);

//===================================================================

assert.equal(
  extractNumber(frontendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  extractNumber(backendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  'Cart pharmacy limits differ between frontend and backend'
);

//===================================================================

console.log(
  'Type contract parity check passed (auth applications, roles, product categories, product request statuses, cart limit).'
);
