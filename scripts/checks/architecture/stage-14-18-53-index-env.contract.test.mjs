import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

//===================================================================

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

//===================================================================

const migration = read(
  'apps/api/src/scripts/migrations/pharmacies/ensure-public-pharmacy-name-index.ts'
);

const diagnostic = read(
  'apps/api/src/scripts/diagnostics/diagnose-public-pharmacy-options.ts'
);

//===================================================================

test('index migration loads the API .env before resolving MONGODB_URI', () => {
  assert.match(migration, /^import 'dotenv\/config';/);
  assert.match(migration, /process\.env\.MONGODB_URI\?\.trim\(\)/);
  assert.match(migration, /Pharmacy\.collection\.createIndex\(/);
  assert.match(migration, /\{ name: 1, _id: 1, status: 1 \}/);

  assert.doesNotMatch(
    migration,
    /\.updateOne\(|\.deleteMany\(|\.findOneAndUpdate\(/
  );
});

//===================================================================

test('performance diagnostic loads the API .env and remains read-only', () => {
  assert.match(diagnostic, /^import 'dotenv\/config';/);
  assert.match(diagnostic, /process\.env\.MONGODB_URI\?\.trim\(\)/);

  assert.doesNotMatch(
    diagnostic,
    /\.createIndex\(|\.updateOne\(|\.deleteMany\(|\.syncIndexes\(/
  );
});

//===================================================================

test('migration failure reports a redacted message instead of only Error/null', () => {
  assert.match(migration, /message: safeMessage/);
  assert.match(migration, /MongoDB URI redacted/);
  assert.match(migration, /codeName: failure\.codeName/);
});
