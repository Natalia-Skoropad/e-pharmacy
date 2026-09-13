import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

test('product request deletion keeps request and private-note cleanup in one transaction', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/product-request.service.ts'),
    'utf8'
  );

  const start = source.indexOf(
    'export async function deleteProductRequestService'
  );

  const end = source.indexOf(
    '//===============================================================',
    start + 20
  );

  const deleteSource = source.slice(start, end);

  assert.match(deleteSource, /mongoose\.startSession\(\)/);
  assert.match(deleteSource, /session\.withTransaction\(async \(\) =>/);

  assert.match(
    deleteSource,
    /ProductRequest\.findOne\([\s\S]*?\.session\(session\)/
  );

  assert.match(
    deleteSource,
    /ProductRequest\.deleteOne\([\s\S]*?\.session\(session\)/
  );

  assert.match(
    deleteSource,
    /PharmacyNote\.deleteMany\([\s\S]*?\.session\(session\)/
  );

  assert.match(deleteSource, /await session\.endSession\(\)/);
  assert.doesNotMatch(deleteSource, /Promise\.all\(/);
});

//===================================================================

test('legacy request history is explicitly marked as inferred in the API projection', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/services/product-request.service.ts'),
    'utf8'
  );

  assert.match(
    source,
    /const hasPersistedHistory = Boolean\(request\.history\?\.length\)/
  );

  assert.match(source, /isInferred: !hasPersistedHistory/);
});
