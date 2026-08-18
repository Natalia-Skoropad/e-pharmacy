import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('legacy public entity URLs permanently redirect to typed canonical URLs', async () => {
  const [pageSource, resolverSource] = await Promise.all([
    readFile(
      new URL('../../app/(public)/[slugId]/page.tsx', import.meta.url),
      'utf8'
    ),
    readFile(new URL('./legacy-public-route.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(pageSource, /resolveLegacyPublicEntity/);
  assert.match(resolverSource, /getIdFromSlugId/);
  assert.match(pageSource, /permanentRedirect\(/);
  assert.match(pageSource, /buildProductPath\(/);
  assert.match(pageSource, /buildPharmacyPath\(/);
});
