import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

//===================================================================

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

//===================================================================

const service = read(
  'apps/api/src/services/pharmacies/pharmacy-search-options.service.ts'
);

const model = read('apps/api/src/models/pharmacies/pharmacy.model.ts');

const diagnostic = read(
  'apps/api/src/scripts/diagnostics/diagnose-public-pharmacy-options.ts'
);

const migration = read(
  'apps/api/src/scripts/migrations/pharmacies/ensure-public-pharmacy-name-index.ts'
);

//===================================================================

const scripts = JSON.parse(read('apps/api/package.json')).scripts;

//===================================================================

test('public option pages select ordered IDs before hydrating large image/contact fields', () => {
  assert.match(
    service,
    /Pharmacy\.find\(filter\)\s*\.select\('_id'\)\s*\.sort\(\{ name: 1, _id: 1 \}\)\s*\.skip\(skip\)\s*\.limit\(perPage\)/
  );

  assert.match(
    service,
    /Pharmacy\.aggregate<[\s\S]*?_id: \{ \$in: pageIds \},[\s\S]*?status: PUBLIC_PHARMACY_STATUS_FILTER/
  );

  assert.match(service, /imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION/);

  assert.doesNotMatch(
    service,
    /\.select\('_id name imageUrl email phone location'\)/
  );

  assert.match(service, /pageIds\.flatMap\(/);
  assert.match(service, /detailsById\.get\(String\(id\)\)/);
  assert.match(service, /Pharmacy\.countDocuments\(filter\)/);
  assert.match(service, /totalPages: Math\.ceil\(total \/ perPage\)/);
});

//===================================================================

test('selectedId path stays an indexed single-record read and location filters are unchanged', () => {
  assert.match(service, /if \(selectedId\) \{[\s\S]*?Pharmacy\.aggregate/);
  assert.match(service, /\.hint\(\{ _id: 1 \}\)/);
  assert.match(service, /createCanonicalLocationRegExp\(settlement\)/);
  assert.match(service, /createCanonicalLocationRegExp\(region\)/);
  assert.match(service, /createFlexibleSearchRegExp\(search\)/);
  assert.match(service, /const \[result\] = await Pharmacy\.aggregate/);
});

//===================================================================

test('new index supports public autocomplete name sorting across active statuses', () => {
  assert.match(model, /\{ name: 1, _id: 1, status: 1 \}/);
  assert.match(model, /name: 'public_pharmacy_name_order'/);
  assert.match(migration, /collection\.createIndex\(/);
  assert.match(migration, /\{ name: 1, _id: 1, status: 1 \}/);

  assert.doesNotMatch(
    migration,
    /\.updateOne\(|\.deleteMany\(|\.findOneAndUpdate\(/
  );

  assert.match(
    scripts['migrate:public-pharmacy-name-index'],
    /run-with-bff-secret\.mjs/
  );
});

//===================================================================

test('read-only diagnostic measures photo payload size, index and query plan without leaking PII', () => {
  assert.match(diagnostic, /autoIndex: false/);
  assert.match(diagnostic, /autoCreate: false/);
  assert.match(diagnostic, /\.explain\(\s*'executionStats'/);
  assert.match(diagnostic, /imageChars:/);
  assert.match(diagnostic, /imageIsDataUrl:/);
  assert.doesNotMatch(diagnostic, /console\.log\(.*?\.name/);

  assert.doesNotMatch(
    diagnostic,
    /\.createIndex\(|\.updateOne\(|\.deleteMany\(|\.syncIndexes\(/
  );

  assert.match(
    scripts['diagnose:public-pharmacy-options'],
    /run-with-bff-secret\.mjs/
  );
});
