import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = readFileSync(
  resolve(process.cwd(), 'src/middlewares/auth.middleware.ts'),
  'utf8'
);

//===================================================================

test('current access cookies are attempted before the legacy migration fallback', () => {
  assert.match(
    source,
    /return \[\.\.\.accessCandidates, \.\.\.legacyCandidates\]/
  );
});

//===================================================================

test('successful legacy-cookie fallback emits token-free sunset telemetry', () => {
  assert.match(source, /candidate\.source === 'legacy_cookie'/);
  assert.match(source, /type:\s*'legacy_auth_cookie_used'/);
  assert.match(source, /logger\.security/);

  assert.doesNotMatch(
    source,
    /logger\.security\([\s\S]{0,300}candidate\.token/
  );
});
