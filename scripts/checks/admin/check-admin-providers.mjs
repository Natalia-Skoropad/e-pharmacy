import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

//===================================================================

const read = (path) =>
  readFileSync(
    new URL(`../../../apps/admin/src/providers/${path}`, import.meta.url),
    'utf8'
  );

const provider = read('AdminProviders.tsx');

//===================================================================

assert.match(provider, /^\s*['"]use client['"];?/);

assert.match(
  provider,
  /import\s*\{\s*ToastProvider\s*\}\s*from ['"]@e-pharmacy\/ui\/feedback['"]/
);

assert.match(provider, /<ToastProvider>\{children\}<\/ToastProvider>/);

assert.match(
  read('index.ts'),
  /export\s*\{\s*AdminProviders\s*\}\s*from ['"]\.\/AdminProviders['"]/
);

assert.doesNotMatch(
  provider,
  /\b(?:fetch|localApiRequest|XMLHttpRequest|WebSocket)\s*\(|axios|API_BASE_URL|BACKEND_URL|https?:\/\//
);

assert.doesNotMatch(
  provider,
  /accessToken|refreshToken|Authorization|document\s*\.\s*cookie|localStorage|sessionStorage|indexedDB/
);

assert.doesNotMatch(provider, /AuthProvider|useAuth|@\/lib\/api/);

//===================================================================

console.log(
  'Admin providers check passed (shared Toast provider, no auth/network logic).'
);
