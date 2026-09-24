import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

//===================================================================

const read = (path) =>
  readFileSync(
    new URL(`../../../apps/admin/src/providers/${path}`, import.meta.url),
    'utf8'
  );

const provider = read('AdminProviders.tsx');
const authProvider = read('AuthProvider/AuthProvider.tsx');

//===================================================================

assert.match(provider, /^\s*['"]use client['"];?/);

assert.match(
  provider,
  /import\s*\{\s*ToastProvider\s*\}\s*from ['"]@e-pharmacy\/ui\/feedback['"]/
);

assert.match(
  provider,
  /import\s*\{\s*AuthProvider\s*\}\s*from ['"]\.\/AuthProvider['"]/
);

assert.match(provider, /<ToastProvider>/);
assert.match(provider, /<AuthProvider>\{children\}<\/AuthProvider>/);

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

//===================================================================

assert.match(authProvider, /^\s*['"]use client['"];?/);
assert.match(authProvider, /AuthProviderCore/);
assert.match(authProvider, /bootstrapMode=['"]always['"]/);
assert.match(authProvider, /getCurrentUser/);
assert.match(authProvider, /login:\s*loginUser/);
assert.match(authProvider, /logout:\s*logoutUser/);
assert.doesNotMatch(authProvider, /\bregister\s*:/);

assert.doesNotMatch(
  authProvider,
  /\bfetch\s*\(|API_BASE_URL|BACKEND_URL|accessToken|refreshToken|Authorization|document\s*\.\s*cookie|localStorage|sessionStorage/
);

//===================================================================

console.log(
  'Admin providers check passed (shared Toast/Auth providers, always-bootstrap session boundary).'
);
