import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');

const seed = readSource('scripts/seeds/seed.ts');
const migration = readSource('scripts/migrations/pharmacies/migrate-demo-pharmacy-bank-details.ts');

//===================================================================

test('demo bank details contain a receipt email and non-destructive repair is scoped to demos', () => {
  const start = seed.indexOf('function createBankDetails(');

  const end = seed.indexOf(
    '//===============================================================',
    start
  );
  const factory = seed.slice(start, end);

  assert.match(factory, /receiptEmail:/);
  assert.match(factory, /recipientName:/);
  assert.match(factory, /iban:/);
  assert.match(migration, /e-pharmacy\.example\.com/);
  assert.match(migration, /bankDetails\.receiptEmail/);
  assert.doesNotMatch(migration, /deleteMany|insertMany/);
});
