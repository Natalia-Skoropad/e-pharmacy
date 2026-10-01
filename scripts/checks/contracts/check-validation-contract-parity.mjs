import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

//===================================================================

const FRONTEND_FIXTURE = path.join(
  ROOT_DIR,
  'packages',
  'validation',
  'src',
  'contracts',
  'validation-contract-cases.json'
);

//===================================================================

const BACKEND_FIXTURE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'schemas',
  'contracts',
  'validation-contract-cases.json'
);

//===================================================================

const PHARMACY_NOTE_VALIDATION_SOURCE = path.join(
  ROOT_DIR,
  'packages',
  'validation',
  'src',
  'pharmacy',
  'pharmacy-note-validation.ts'
);

const PHARMACY_NOTE_SCHEMA_SOURCE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'schemas',
  'pharmacy-note.schema.ts'
);

const PHARMACY_NOTE_MODEL_SOURCE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'models',
  'pharmacyNote.model.ts'
);

const ORDER_SCHEMA_SOURCE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'schemas',
  'order.schema.ts'
);

const ORDER_MODEL_SOURCE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'models',
  'order.model.ts'
);

const REFERENCE_DATA_NAME_VALIDATION_SOURCE = path.join(
  ROOT_DIR,
  'packages',
  'validation',
  'src',
  'reference-data',
  'reference-data-name.ts'
);

const PRODUCT_CATEGORY_SLUG_VALIDATION_SOURCE = path.join(
  ROOT_DIR,
  'packages',
  'validation',
  'src',
  'reference-data',
  'product-category-slug.ts'
);

const BACKEND_SETTINGS_DICTIONARY_CONSTANTS_SOURCE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'constants',
  'settings-dictionary.ts'
);

const BACKEND_PRODUCT_CATEGORY_CONSTANTS_SOURCE = path.join(
  ROOT_DIR,
  'apps',
  'api',
  'src',
  'constants',
  'product-category.ts'
);

//===================================================================

async function readFixture(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

//===================================================================
async function readSource(filePath) {
  return readFile(filePath, 'utf8');
}

//===================================================================

function requireIntegerMatch(source, pattern, label) {
  const match = source.match(pattern);

  assert.ok(match, `${label} was not found`);

  const value = Number(match[1]);
  assert.equal(Number.isInteger(value), true, `${label} is not an integer`);
  return value;
}

//===================================================================

function requireRegexLiteral(source, variableName, label) {
  const match = source.match(
    new RegExp(`${variableName}\\s*=\\s*\/([^\/]+)\/([a-z]*)`)
  );

  assert.ok(match, `${label} was not found`);
  return `/${match[1]}/${match[2]}`;
}

//===================================================================

function assertUniqueCaseIds(fixture, label) {
  assert.ok(
    fixture && typeof fixture === 'object',
    `${label} fixture is invalid`
  );

  assert.ok(
    Array.isArray(fixture.cases),
    `${label} fixture has no cases array`
  );

  const ids = fixture.cases.map((contractCase) => contractCase?.id);

  assert.equal(
    ids.every((id) => typeof id === 'string' && id.length > 0),
    true,
    `${label} fixture contains an invalid case ID`
  );

  assert.equal(
    new Set(ids).size,
    ids.length,
    `${label} fixture contains duplicate case IDs`
  );
}

//===================================================================

const [
  frontendFixture,
  backendFixture,
  pharmacyNoteValidationSource,
  pharmacyNoteSchemaSource,
  pharmacyNoteModelSource,
  orderSchemaSource,
  orderModelSource,
  referenceDataNameValidationSource,
  productCategorySlugValidationSource,
  backendSettingsDictionaryConstantsSource,
  backendProductCategoryConstantsSource,
] = await Promise.all([
  readFixture(FRONTEND_FIXTURE),
  readFixture(BACKEND_FIXTURE),
  readSource(PHARMACY_NOTE_VALIDATION_SOURCE),
  readSource(PHARMACY_NOTE_SCHEMA_SOURCE),
  readSource(PHARMACY_NOTE_MODEL_SOURCE),
  readSource(ORDER_SCHEMA_SOURCE),
  readSource(ORDER_MODEL_SOURCE),
  readSource(REFERENCE_DATA_NAME_VALIDATION_SOURCE),
  readSource(PRODUCT_CATEGORY_SLUG_VALIDATION_SOURCE),
  readSource(BACKEND_SETTINGS_DICTIONARY_CONSTANTS_SOURCE),
  readSource(BACKEND_PRODUCT_CATEGORY_CONSTANTS_SOURCE),
]);

//===================================================================

assertUniqueCaseIds(frontendFixture, 'Frontend');
assertUniqueCaseIds(backendFixture, 'Backend');

assert.deepEqual(
  backendFixture,
  frontendFixture,
  'Frontend and backend validation contract fixtures differ'
);

const pharmacyNoteMaxLength = requireIntegerMatch(
  pharmacyNoteValidationSource,
  /PHARMACY_NOTE_MAX_LENGTH\s*=\s*(\d+)/,
  'Frontend pharmacy note max length'
);

const backendPharmacyNoteMaxLength = requireIntegerMatch(
  pharmacyNoteSchemaSource,
  /createPharmacyNoteSchema[\s\S]*?\.max\((\d+)\)/,
  'Backend pharmacy note max length'
);

const storedPharmacyNoteMaxLength = requireIntegerMatch(
  pharmacyNoteModelSource,
  /text:\s*\{[\s\S]*?maxlength:\s*(\d+)/,
  'Stored pharmacy note max length'
);

assert.equal(
  backendPharmacyNoteMaxLength,
  pharmacyNoteMaxLength,
  'Frontend and backend pharmacy note max lengths differ'
);

assert.equal(
  storedPharmacyNoteMaxLength,
  pharmacyNoteMaxLength,
  'Frontend and stored pharmacy note max lengths differ'
);

const backendOrderCommentMaxLength = requireIntegerMatch(
  orderSchemaSource,
  /createOrderManagerCommentSchema[\s\S]*?\.max\((\d+)\)/,
  'Backend order manager comment max length'
);

const storedOrderCommentMaxLength = requireIntegerMatch(
  orderModelSource,
  /const managerCommentSchema[\s\S]*?text:\s*\{[\s\S]*?maxlength:\s*(\d+)/,
  'Stored order manager comment max length'
);

assert.equal(
  backendOrderCommentMaxLength,
  pharmacyNoteMaxLength,
  'Frontend and backend order comment max lengths differ'
);

assert.equal(
  storedOrderCommentMaxLength,
  pharmacyNoteMaxLength,
  'Frontend and stored order comment max lengths differ'
);

const referenceDataNameMaxLength = requireIntegerMatch(
  referenceDataNameValidationSource,
  /REFERENCE_DATA_NAME_MAX_LENGTH\s*=\s*(\d+)/,
  'Shared reference-data name max length'
);

const backendDictionaryNameMaxLength = requireIntegerMatch(
  backendSettingsDictionaryConstantsSource,
  /SETTINGS_DICTIONARY_NAME_MAX_LENGTH\s*=\s*(\d+)/,
  'Backend settings dictionary name max length'
);

assert.equal(
  backendDictionaryNameMaxLength,
  referenceDataNameMaxLength,
  'Shared and backend settings dictionary name max lengths differ'
);

assert.equal(
  requireRegexLiteral(
    backendSettingsDictionaryConstantsSource,
    'SETTINGS_DICTIONARY_NAME_PATTERN',
    'Backend settings dictionary name pattern'
  ),

  requireRegexLiteral(
    referenceDataNameValidationSource,
    'REFERENCE_DATA_NAME_PATTERN',
    'Shared reference-data name pattern'
  ),

  'Shared and backend settings dictionary name patterns differ'
);

assert.match(
  backendProductCategoryConstantsSource,
  /PRODUCT_CATEGORY_NAME_MAX_LENGTH\s*=\s*SETTINGS_DICTIONARY_NAME_MAX_LENGTH/,
  'Product categories must reuse the backend settings dictionary name max length'
);

assert.match(
  backendProductCategoryConstantsSource,
  /PRODUCT_CATEGORY_NAME_PATTERN\s*=\s*SETTINGS_DICTIONARY_NAME_PATTERN/,
  'Product categories must reuse the backend settings dictionary name pattern'
);

assert.equal(
  requireRegexLiteral(
    backendProductCategoryConstantsSource,
    'PRODUCT_CATEGORY_SLUG_PATTERN',
    'Backend product category slug pattern'
  ),

  requireRegexLiteral(
    productCategorySlugValidationSource,
    'PRODUCT_CATEGORY_SLUG_PATTERN',
    'Shared product category slug pattern'
  ),

  'Shared and backend product category slug patterns differ'
);

console.log(
  `Validation contract parity check passed (${frontendFixture.cases.length} mirrored cases).`
);
