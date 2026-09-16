import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

//===================================================================

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DETAILS_SOURCE = path.join(
  CURRENT_DIR,
  'OrderDetailsPageContent',
  'OrderDetailsPageContent.tsx'
);

//===================================================================

test('product picker loads categories from the canonical product filters endpoint', async () => {
  const source = await readFile(DETAILS_SOURCE, 'utf8');

  const loadCategories = source.match(
    /async function loadCategories\(\)[\s\S]*?void loadCategories\(\);/
  )?.[0];

  assert.ok(loadCategories, 'Product picker category loader was not found');
  assert.match(loadCategories, /getProductFilters\(/);
  assert.match(loadCategories, /pharmacyId:\s*order\.pharmacyId/);
  assert.match(loadCategories, /inStock:\s*true/);
  assert.doesNotMatch(loadCategories, /getProducts\(/);
  assert.doesNotMatch(loadCategories, /response\.items/);
});
