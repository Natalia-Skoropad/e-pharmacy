import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { buildTrustedAppOrigins } from './trusted-app-origins';

//===============================================================

test('derives trusted origins from client, pharmacy and admin application URLs', () => {
  const origins = buildTrustedAppOrigins({
    appUrls: [
      'https://client.example.com/app',
      'https://pharmacy.example.com/dashboard',
      'https://admin.example.com/',
    ],
    extraOrigins: ['https://preview.example.com/path'],
  });

  assert.deepEqual(origins, [
    'https://client.example.com',
    'https://pharmacy.example.com',
    'https://admin.example.com',
    'https://preview.example.com',
  ]);
  assert.equal(origins.includes('https://malicious.example.com'), false);
});

//===============================================================

test('rejects unsafe trusted-origin configuration at startup', () => {
  assert.throws(
    () =>
      buildTrustedAppOrigins({
        appUrls: ['ftp://client.example.com'],
      }),
    /http or https/
  );

  assert.throws(
    () =>
      buildTrustedAppOrigins({
        appUrls: ['https://user:secret@client.example.com'],
      }),
    /must not contain URL credentials/
  );
});


//===============================================================

test('CORS and mutation-origin middleware use the same trusted-origin set', async () => {
  const [appSource, originSource] = await Promise.all([
    readFile(path.resolve(__dirname, '../app.ts'), 'utf8'),
    readFile(path.resolve(__dirname, '../middlewares/origin.middleware.ts'), 'utf8'),
  ]);

  assert.match(appSource, /env\.TRUSTED_APP_ORIGINS\.includes\(origin\)/);
  assert.match(originSource, /new Set\(env\.TRUSTED_APP_ORIGINS\)/);
  assert.doesNotMatch(appSource, /env\.CLIENT_ORIGINS/);
  assert.doesNotMatch(originSource, /env\.CLIENT_ORIGINS/);
});
