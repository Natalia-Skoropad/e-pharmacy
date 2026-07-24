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

async function readJson(...segments) {
  return JSON.parse(await readSource(...segments));
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

function extractTypeUnionValues(source, typeName) {
  const pattern = new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`);
  const match = source.match(pattern);

  assert.ok(match, `Could not read ${typeName}`);

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(
    (valueMatch) => valueMatch[1]
  );
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

const [frontendFixture, backendFixture] = await Promise.all([
  readJson('packages', 'types', 'contracts', 'type-contracts.fixture.json'),
  readJson('apps', 'api', 'src', 'contracts', 'type-contracts.fixture.json'),
]);

//===================================================================

assert.deepEqual(
  backendFixture,
  frontendFixture,
  'Frontend and backend type-contract fixtures differ'
);

//===================================================================

const [
  frontendAuth,
  frontendUser,
  frontendPharmacy,
  frontendProduct,
  frontendCategories,
  frontendRequestStatuses,
  frontendReview,
  frontendOrder,
  frontendNotes,
  frontendCart,
  backendAuth,
  backendProduct,
  backendCategories,
  backendRequestStatuses,
  backendOrder,
  backendPharmacyNote,
  backendCart,
] = await Promise.all([
  readSource('packages', 'config', 'src', 'auth', 'domain-values.ts'),
  readSource('packages', 'types', 'src', 'auth', 'role.ts'),
  readSource('packages', 'types', 'src', 'pharmacies', 'status.ts'),
  readSource('packages', 'types', 'src', 'products', 'product-summary.ts'),
  readSource('packages', 'config', 'src', 'products', 'categories.ts'),
  readSource('packages', 'config', 'src', 'product-requests', 'statuses.ts'),
  readSource('packages', 'types', 'src', 'reviews', 'review.ts'),
  readSource('packages', 'types', 'src', 'orders', 'status.ts'),
  readSource('packages', 'types', 'src', 'notes', 'pharmacy-note.ts'),
  readSource('packages', 'config', 'src', 'cart', 'cart-constants.ts'),
  readSource('apps', 'api', 'src', 'constants', 'auth.ts'),
  readSource('apps', 'api', 'src', 'types', 'product.ts'),
  readSource('apps', 'api', 'src', 'types', 'categories.ts'),

  readSource(
    'apps',
    'api',
    'src',
    'constants',
    'product-request-validation.ts'
  ),

  readSource('apps', 'api', 'src', 'types', 'order.ts'),
  readSource('apps', 'api', 'src', 'models', 'pharmacyNote.model.ts'),
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
  'User statuses',
  extractTypeUnionValues(frontendUser, 'UserStatus'),
  extractObjectValues(backendAuth, 'USER_STATUSES')
);

//===================================================================

assertSameValues(
  'Pharmacy statuses',
  extractTypeUnionValues(frontendPharmacy, 'PharmacyStatus'),
  extractObjectValues(backendAuth, 'PHARMACY_STATUSES')
);

//===================================================================

assertSameValues(
  'Product statuses',
  extractTypeUnionValues(frontendProduct, 'ProductStatus'),
  extractTypeUnionValues(backendProduct, 'ProductStatus')
);

//===================================================================

assertSameValues(
  'Review moderation statuses',
  extractTypeUnionValues(frontendReview, 'ReviewModerationStatus'),
  extractTypeUnionValues(backendProduct, 'ReviewModerationStatus')
);

//===================================================================

assertSameValues(
  'Order statuses',
  extractTypeUnionValues(frontendOrder, 'OrderStatus'),
  extractTypeUnionValues(backendOrder, 'OrderStatus')
);

//===================================================================

assertSameValues(
  'Delivery methods',
  extractTypeUnionValues(frontendOrder, 'DeliveryMethod'),
  extractTypeUnionValues(backendOrder, 'DeliveryMethod')
);

//===================================================================

assertSameValues(
  'Payment methods',
  extractTypeUnionValues(frontendOrder, 'PaymentMethod'),
  extractTypeUnionValues(backendOrder, 'PaymentMethod')
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

assertSameValues(
  'Pharmacy note entity types',
  extractTypeUnionValues(frontendNotes, 'PharmacyNoteEntityType'),
  [
    ...new Set(
      [
        ...backendPharmacyNote.matchAll(
          /['\"](client|product|pharmacy|product_request)['\"]/g
        ),
      ].map((match) => match[1])
    ),
  ]
);

//===================================================================

assert.equal(
  extractNumber(frontendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  extractNumber(backendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  'Cart pharmacy limits differ between frontend and backend'
);

//===================================================================

assert.match(frontendFixture.dateExamples.calendarDate, /^\d{4}-\d{2}-\d{2}$/);

assert.equal(
  new Date(frontendFixture.dateExamples.dateTime).toISOString(),
  frontendFixture.dateExamples.dateTime,
  'Date-time fixture is not a canonical ISO timestamp'
);

assert.equal(
  frontendFixture.dateExamples.calendarDate.includes('T'),
  false,
  'Calendar date fixture must not contain a time component'
);

//===================================================================

console.log(
  'Type contract parity check passed (value sets, cart limit, contract shapes, and date examples).'
);
