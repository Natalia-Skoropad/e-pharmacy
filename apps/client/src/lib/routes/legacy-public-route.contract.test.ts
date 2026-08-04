import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('legacy public entity URLs permanently redirect to typed canonical URLs', async () => {
  const source = await readFile(
    new URL('../../app/(public)/[slugId]/page.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /resolveLegacyPublicEntity/);
  assert.match(source, /getIdFromSlugId/);
  assert.match(source, /permanentRedirect\(/);
  assert.match(source, /buildProductPath\(/);
  assert.match(source, /buildPharmacyPath\(/);
});
