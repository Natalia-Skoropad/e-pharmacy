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
] = await Promise.all([
  readFixture(FRONTEND_FIXTURE),
  readFixture(BACKEND_FIXTURE),
  readSource(PHARMACY_NOTE_VALIDATION_SOURCE),
  readSource(PHARMACY_NOTE_SCHEMA_SOURCE),
  readSource(PHARMACY_NOTE_MODEL_SOURCE),
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

console.log(
  `Validation contract parity check passed (${frontendFixture.cases.length} mirrored cases).`
);
