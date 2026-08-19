import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

//===================================================================

test('ordinary JSON uses a small global parser while document payloads opt into the large parser', () => {
  const appSource = readFileSync(path.resolve(__dirname, './app.ts'), 'utf8');

  const limitsSource = readFileSync(
    path.resolve(__dirname, './constants/request-body.ts'),
    'utf8'
  );

  assert.match(limitsSource, /standardJson:\s*'1mb'/);
  assert.match(limitsSource, /documentUpload:\s*'32mb'/);

  for (const routePath of [
    '/auth/pharmacy-documents',
    '/pharmacies/me/documents',
    '/product-requests',
  ]) {
    assert.match(appSource, new RegExp(routePath.replaceAll('/', '\\/')));
  }

  assert.match(
    appSource,
    /express\.json\(\{ limit: API_JSON_BODY_LIMITS\.documentUpload \}\)[\s\S]*express\.json\(\{ limit: API_JSON_BODY_LIMITS\.standardJson \}\)/
  );
});
