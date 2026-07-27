import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

//===================================================================

async function loadTypeScript() {
  try {
    const module = await import('typescript');
    return module.default ?? module;
  } catch {
    const fallbackPath = path.join(
      ROOT_DIR,
      'packages',
      'types',
      'node_modules',
      'typescript',
      'lib',
      'typescript.js'
    );

    const module = await import(pathToFileURL(fallbackPath).href);
    return module.default ?? module;
  }
}

//===================================================================

async function collectTypeScriptFiles(directory, output = []) {
  const { readdir } = await import('node:fs/promises');

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.turbo', '.next'].includes(entry.name)) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await collectTypeScriptFiles(entryPath, output);
      continue;
    }

    if (entry.name.endsWith('.ts')) output.push(entryPath);
  }

  return output;
}

//===================================================================

function findNamedTypeDeclaration(ts, sourceFile, typeName) {
  let declaration;

  sourceFile.forEachChild((node) => {
    if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name.text === typeName
    ) {
      declaration = node;
    }
  });

  assert.ok(
    declaration,
    `Could not find ${typeName} in ${path.relative(ROOT_DIR, sourceFile.fileName)}`
  );

  return declaration;
}

//===================================================================

function getNamedType(ts, program, relativeFile, typeName) {
  const sourceFile = program.getSourceFile(path.join(ROOT_DIR, relativeFile));

  assert.ok(sourceFile, `Could not load ${relativeFile}`);

  const declaration = findNamedTypeDeclaration(ts, sourceFile, typeName);
  return {
    checker: program.getTypeChecker(),
    declaration,
    type: program.getTypeChecker().getTypeAtLocation(declaration),
  };
}

//===================================================================

function getUnionMemberByDiscriminant(
  ts,
  checker,
  unionType,
  propertyName,
  expectedValue,
  label
) {
  assert.ok(unionType.isUnion(), `${label} must be a union`);

  const member = unionType.types.find((candidate) => {
    const property = checker.getPropertyOfType(candidate, propertyName);
    if (!property) return false;

    const propertyType = checker.getTypeOfSymbolAtLocation(
      property,
      property.valueDeclaration ?? property.declarations?.[0]
    );

    return (
      (propertyType.flags & ts.TypeFlags.StringLiteral) !== 0 &&
      propertyType.value === expectedValue
    );
  });

  assert.ok(member, `Could not find ${label} union member`);
  return member;
}

//===================================================================

function getTypeShape(ts, checker, type) {
  const required = [];
  const optional = [];

  for (const property of checker.getPropertiesOfType(type)) {
    const location = property.valueDeclaration ?? property.declarations?.[0];
    const propertyType = checker.getTypeOfSymbolAtLocation(property, location);
    const isOptional = (property.flags & ts.SymbolFlags.Optional) !== 0;

    // `details?: never` is a forbidden discriminated-union property, not a
    // transport field that may be sent.
    const isForbiddenNeverProperty =
      isOptional &&
      (propertyType.flags &
        (ts.TypeFlags.Never | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) !==
        0;

    if (isForbiddenNeverProperty) continue;

    (isOptional ? optional : required).push(property.name);
  }

  return {
    required: required.sort(),
    optional: optional.sort(),
  };
}

//===================================================================

function assertShape(label, actual, expected) {
  assert.deepEqual(
    actual,
    {
      required: [...expected.required].sort(),
      optional: [...expected.optional].sort(),
    },
    `${label} shape differs from the parity fixture`
  );
}

//===================================================================

function assertPaginationFields(label, actual, expected) {
  for (const field of expected.required) {
    assert.ok(
      actual.required.includes(field),
      `${label} must require pagination field ${field}`
    );
  }
}

//===================================================================

async function assertActualTypeShapes(frontendFixture) {
  const ts = await loadTypeScript();

  const frontendFiles = await collectTypeScriptFiles(
    path.join(ROOT_DIR, 'packages', 'types', 'src')
  );

  const backendFiles = await collectTypeScriptFiles(
    path.join(ROOT_DIR, 'apps', 'api', 'src', 'types')
  );

  const frontendProgram = ts.createProgram(frontendFiles, {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });

  const backendProgram = ts.createProgram(backendFiles, {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
  });

  const frontendContracts = [
    [
      'pagination',
      'packages/types/src/api/pagination.ts',
      'ApiPaginationResponse',
    ],
    [
      'editableBankDetails',
      'packages/types/src/pharmacies/bank-details.ts',
      'EditablePharmacyBankDetails',
    ],
    [
      'completeBankDetails',
      'packages/types/src/pharmacies/bank-details.ts',
      'CompletePharmacyBankDetails',
    ],
    [
      'publicBankDetails',
      'packages/types/src/pharmacies/bank-details.ts',
      'PublicPaymentBankDetails',
    ],
    [
      'verificationDocument',
      'packages/types/src/primitives/file-metadata.ts',
      'FileMetadata',
    ],
    [
      'fileMetadata',
      'packages/types/src/primitives/file-metadata.ts',
      'FileMetadata',
    ],
    [
      'productRequestFile',
      'packages/types/src/product-requests/payload.ts',
      'ProductRequestFile',
    ],
    [
      'createReviewPayload',
      'packages/types/src/reviews/payloads.ts',
      'CreateReviewPayload',
    ],
    [
      'moderateReviewPayload',
      'packages/types/src/reviews/payloads.ts',
      'ModerateReviewPayload',
    ],
    [
      'favoriteIdsResponse',
      'packages/types/src/api/response.ts',
      'FavoriteIdsResponse',
    ],
    [
      'favoriteMutationResponse',
      'packages/types/src/api/response.ts',
      'FavoriteMutationResponse',
    ],
    ['clientOrder', 'packages/types/src/orders/client-order.ts', 'ClientOrder'],
    [
      'clientOrderItem',
      'packages/types/src/orders/client-order.ts',
      'ClientOrderItem',
    ],
    [
      'productRequestResponse',
      'packages/types/src/product-requests/transport.ts',
      'ProductRequestResponseDto',
    ],
  ];

  for (const [fixtureName, relativeFile, typeName] of frontendContracts) {
    const { checker, type } = getNamedType(
      ts,
      frontendProgram,
      relativeFile,
      typeName
    );

    assertShape(
      `Frontend ${typeName}`,
      getTypeShape(ts, checker, type),
      frontendFixture.shapes[fixtureName]
    );
  }

  const frontendDelivery = getNamedType(
    ts,
    frontendProgram,
    'packages/types/src/orders/delivery.ts',
    'Delivery'
  );

  for (const [fixtureName, method] of [
    ['pickupDelivery', 'pickup'],
    ['postalDelivery', 'postal_delivery'],
  ]) {
    const member = getUnionMemberByDiscriminant(
      ts,
      frontendDelivery.checker,
      frontendDelivery.type,
      'method',
      method,
      `Frontend Delivery(${method})`
    );

    assertShape(
      `Frontend Delivery(${method})`,
      getTypeShape(ts, frontendDelivery.checker, member),
      frontendFixture.shapes[fixtureName]
    );
  }

  const backendContracts = [
    [
      'editableBankDetails',
      'apps/api/src/types/pharmacy.ts',
      'EditablePharmacyBankDetails',
    ],
    [
      'completeBankDetails',
      'apps/api/src/types/pharmacy.ts',
      'CompletePharmacyBankDetails',
    ],
    [
      'publicBankDetails',
      'apps/api/src/types/pharmacy.ts',
      'PublicPaymentBankDetails',
    ],
    [
      'verificationDocument',
      'apps/api/src/types/pharmacy.ts',
      'PharmacyVerificationDocumentMetadata',
    ],
    [
      'fileMetadata',
      'apps/api/src/types/pharmacy.ts',
      'PharmacyVerificationDocumentMetadata',
    ],
    [
      'productRequestFile',
      'apps/api/src/types/product-request.ts',
      'ProductRequestFile',
    ],
    ['clientOrder', 'apps/api/src/types/order.ts', 'OrderResponseDto'],
    ['clientOrderItem', 'apps/api/src/types/order.ts', 'OrderItemResponseDto'],
    [
      'productRequestResponse',
      'apps/api/src/types/product-request.ts',
      'ProductRequestResponseDto',
    ],
  ];

  for (const [fixtureName, relativeFile, typeName] of backendContracts) {
    const { checker, type } = getNamedType(
      ts,
      backendProgram,
      relativeFile,
      typeName
    );

    assertShape(
      `Backend ${typeName}`,
      getTypeShape(ts, checker, type),
      frontendFixture.shapes[fixtureName]
    );
  }

  const backendDelivery = getNamedType(
    ts,
    backendProgram,
    'apps/api/src/types/order.ts',
    'Delivery'
  );

  for (const [fixtureName, method] of [
    ['pickupDelivery', 'pickup'],
    ['postalDelivery', 'postal_delivery'],
  ]) {
    const member = getUnionMemberByDiscriminant(
      ts,
      backendDelivery.checker,
      backendDelivery.type,
      'method',
      method,
      `Backend Delivery(${method})`
    );

    assertShape(
      `Backend Delivery(${method})`,
      getTypeShape(ts, backendDelivery.checker, member),
      frontendFixture.shapes[fixtureName]
    );
  }

  for (const [relativeFile, typeName] of [
    ['apps/api/src/types/product-request.ts', 'ProductRequestsResponseDto'],
    ['apps/api/src/types/order.ts', 'OrdersResponseDto'],
  ]) {
    const { checker, type } = getNamedType(
      ts,
      backendProgram,
      relativeFile,
      typeName
    );

    assertPaginationFields(
      `Backend ${typeName}`,
      getTypeShape(ts, checker, type),
      frontendFixture.shapes.pagination
    );
  }

  assert.match(
    frontendFixture.dateExamples.calendarDate,
    /^\d{4}-\d{2}-\d{2}$/,
    'Calendar date example must use YYYY-MM-DD'
  );

  const dateTime = frontendFixture.dateExamples.dateTime;
  assert.equal(
    new Date(dateTime).toISOString(),
    dateTime,
    'Date-time example must be a canonical ISO timestamp'
  );
}

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
    `(?:export\\s+)?const\\s+${constName}\\s*=\\s*\\${opening}([\\s\\S]*?)\\${closing}\\s*as\\s+const`
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

function extractZodEnumValues(source, propertyName) {
  const pattern = new RegExp(
    `${propertyName}\\s*:\\s*z\\.enum\\(\\[([\\s\\S]*?)\\]\\)`
  );
  const match = source.match(pattern);

  assert.ok(match, `Could not read z.enum values for ${propertyName}`);

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

await assertActualTypeShapes(frontendFixture);

//===================================================================

const [
  frontendAuth,
  frontendUserStatuses,
  frontendPharmacyStatuses,
  frontendProductStatuses,
  frontendCategories,
  frontendRequestStatuses,
  frontendReview,
  frontendOrderValues,
  frontendNotes,
  frontendClientFilters,
  frontendCart,
  backendAuth,
  backendProductModel,
  backendProductTypes,
  backendCategories,
  backendRequestStatuses,
  backendOrder,
  backendPharmacyNote,
  backendClientSchema,
  backendCart,
] = await Promise.all([
  readSource('packages', 'config', 'src', 'auth', 'domain-values.ts'),
  readSource('packages', 'config', 'src', 'users', 'domain-values.ts'),
  readSource('packages', 'config', 'src', 'pharmacies', 'domain-values.ts'),
  readSource('packages', 'config', 'src', 'products', 'domain-values.ts'),
  readSource('packages', 'config', 'src', 'products', 'categories.ts'),
  readSource('packages', 'config', 'src', 'product-requests', 'statuses.ts'),
  readSource('packages', 'types', 'src', 'reviews', 'review.ts'),
  readSource('packages', 'config', 'src', 'orders', 'domain-values.ts'),
  readSource('packages', 'config', 'src', 'notes', 'entity-types.ts'),

  readSource(
    'apps',
    'pharmacy',
    'src',
    'lib',
    'clients',
    'client-filter-contracts.ts'
  ),

  readSource('packages', 'config', 'src', 'cart', 'limits.ts'),
  readSource('apps', 'api', 'src', 'constants', 'auth.ts'),
  readSource('apps', 'api', 'src', 'models', 'product.model.ts'),
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
  readSource('apps', 'api', 'src', 'schemas', 'client.schema.ts'),
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
  extractArrayValues(frontendUserStatuses, 'USER_STATUSES'),
  extractObjectValues(backendAuth, 'USER_STATUSES')
);

//===================================================================

assertSameValues(
  'Pharmacy statuses',
  extractArrayValues(frontendPharmacyStatuses, 'PHARMACY_STATUSES'),
  extractObjectValues(backendAuth, 'PHARMACY_STATUSES')
);

//===================================================================

assertSameValues(
  'Product statuses',
  extractArrayValues(frontendProductStatuses, 'PRODUCT_STATUSES'),
  extractArrayValues(backendProductModel, 'PRODUCT_STATUSES')
);

//===================================================================

assertSameValues(
  'Review moderation statuses',
  extractTypeUnionValues(frontendReview, 'ReviewModerationStatus'),
  extractTypeUnionValues(backendProductTypes, 'ReviewModerationStatus')
);

//===================================================================

assertSameValues(
  'Order statuses',
  extractArrayValues(frontendOrderValues, 'ORDER_STATUSES'),
  extractTypeUnionValues(backendOrder, 'OrderStatus')
);

//===================================================================

assertSameValues(
  'Delivery methods',
  extractArrayValues(frontendOrderValues, 'DELIVERY_METHODS'),
  extractTypeUnionValues(backendOrder, 'DeliveryMethod')
);

//===================================================================

assertSameValues(
  'Payment methods',
  extractArrayValues(frontendOrderValues, 'PAYMENT_METHODS'),
  extractTypeUnionValues(backendOrder, 'PaymentMethod')
);

//===================================================================

assertSameValues(
  'Order creator types',
  extractArrayValues(frontendOrderValues, 'ORDER_CREATED_BY_TYPES'),
  extractTypeUnionValues(backendOrder, 'OrderCreatedByType')
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
  extractArrayValues(frontendNotes, 'PHARMACY_NOTE_ENTITY_TYPES'),
  [
    ...new Set(
      [
        ...backendPharmacyNote.matchAll(
          /['"](client|product|pharmacy|product_request)['"]/g
        ),
      ].map((match) => match[1])
    ),
  ]
);

//===================================================================

assertSameValues(
  'Client successful-order filters',
  extractArrayValues(
    frontendClientFilters,
    'CLIENT_SUCCESSFUL_ORDER_FILTER_VALUES'
  ),
  extractZodEnumValues(backendClientSchema, 'successfulOrders')
);

//===================================================================

assert.equal(
  extractNumber(frontendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  extractNumber(backendCart, 'MAX_PHARMACY_GROUPS_PER_CART'),
  'Cart pharmacy limits differ between frontend and backend'
);

//===================================================================

assert.match(frontendFixture.dateExamples.calendarDate, /^\d{4}-\d{2}-\d{2}$/);

//===================================================================

assert.equal(
  new Date(frontendFixture.dateExamples.dateTime).toISOString(),
  frontendFixture.dateExamples.dateTime,
  'Date-time fixture is not a canonical ISO timestamp'
);

//===================================================================

assert.equal(
  frontendFixture.dateExamples.calendarDate.includes('T'),
  false,
  'Calendar date fixture must not contain a time component'
);

//===================================================================

console.log(
  'Type contract parity check passed (runtime value sets, filters, cart limit, contract shapes, and date examples).'
);
