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

async function readFixture(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
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

const [frontendFixture, backendFixture] = await Promise.all([
  readFixture(FRONTEND_FIXTURE),
  readFixture(BACKEND_FIXTURE),
]);

//===================================================================

assertUniqueCaseIds(frontendFixture, 'Frontend');
assertUniqueCaseIds(backendFixture, 'Backend');

assert.deepEqual(
  backendFixture,
  frontendFixture,
  'Frontend and backend validation contract fixtures differ'
);

console.log(
  `Validation contract parity check passed (${frontendFixture.cases.length} mirrored cases).`
);
