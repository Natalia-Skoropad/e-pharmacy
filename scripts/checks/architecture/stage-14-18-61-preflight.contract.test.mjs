import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

//===================================================================

const root = process.cwd();

const source = (file) => readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(source(file));

//===================================================================

test('read-only architecture contract tests are not mistaken for production proxy calls', () => {
  const checker = source(
    'scripts/checks/boundaries/check-next-api-boundaries.mjs'
  );

  assert.match(checker, /const isStaticContractTest/);
  assert.match(checker, /rel\.startsWith\('scripts\/checks\/'\)/);
  assert.match(checker, /!rel\.startsWith\('packages\/next-api\/'\)/);
  assert.match(checker, /!isStaticContractTest/);
});

//===================================================================

test('BFF route contract identifies Next dynamic segments separately from Express parameters', () => {
  const entries = readJson(
    'scripts/checks/routes/next-api-route-contracts.json'
  );

  for (const name of ['cancel-review', 'lifecycle-history']) {
    const contract = entries.find(
      (item) =>
        item.app === 'pharmacy' &&
        item.route === `/pharmacies/me/pharmacies/[pharmacyId]/${name}`
    );

    assert.ok(contract, `Missing ${name} BFF route`);

    assert.equal(
      contract.backend,
      `/pharmacies/me/pharmacies/:pharmacyId/${name}`
    );
  }
});

//===================================================================

test('owned pharmacy location BFF route and backend retain private access', () => {
  const entries = readJson(
    'scripts/checks/routes/next-api-route-contracts.json'
  );

  const backend = readJson(
    'scripts/checks/routes/backend-route-access-contracts.json'
  );

  const route = '/pharmacies/me/pharmacies/locations';

  assert.deepEqual(
    entries.find((item) => item.app === 'pharmacy' && item.route === route)
      ?.methods,
    { GET: 'private' }
  );

  assert.deepEqual(backend.find((item) => item.backend === route)?.methods, {
    GET: 'private',
  });
});

//===================================================================

test('the existing twelve-gate QA sequence is preserved without a replacement runner', () => {
  const scripts = readJson('package.json').scripts;

  const expected = [
    'check:source:api',
    'check:source:shared',
    'check:source:client',
    'check:source:pharmacy',
    'check:source:admin',
    'check:lint:serial',
    'check:type-check:serial',
    'check:test:serial',
    'check:react:serial',
    'check:integration:serial',
    'check:build:serial',
    'check:deploy-artifact',
  ];

  for (const name of expected)
    assert.equal(typeof scripts[name], 'string', `${name} is missing`);

  assert.equal(typeof scripts['check:before-deploy'], 'string');
});
