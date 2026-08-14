import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  getProgressiveDelayMs,
  hashRateLimitSecret,
  normalizeRateLimitEmail,
} from './rate-limit-security';

//===================================================================

test('normalizes the account dimension independently from client IP', () => {
  assert.equal(
    normalizeRateLimitEmail('  Owner@Example.COM  '),
    'owner@example.com'
  );

  assert.equal(normalizeRateLimitEmail(''), null);
  assert.equal(normalizeRateLimitEmail(undefined), null);
});

//===================================================================

test('hashes reset secrets before they become rate-limit keys', () => {
  const token = 'raw-reset-token';
  const hash = hashRateLimitSecret(token);

  assert.ok(hash);
  assert.equal(hash?.length, 64);
  assert.notEqual(hash, token);
  assert.equal(hashRateLimitSecret(` ${token} `), hash);
});

//===================================================================

test('progressive delay grows after repeated failures and stays bounded', () => {
  assert.equal(getProgressiveDelayMs(0), 0);
  assert.equal(getProgressiveDelayMs(2), 0);
  assert.equal(getProgressiveDelayMs(3), 250);
  assert.equal(getProgressiveDelayMs(4), 500);
  assert.equal(getProgressiveDelayMs(100), 1_500);
});

//===================================================================

test('auth routes combine IP and account dimensions for credential-sensitive flows', () => {
  const routes = readFileSync(
    path.join(__dirname, '../routes/auth.routes.ts'),
    'utf8'
  );

  assert.match(
    routes,
    /['"]\/login['"][\s\S]*?loginIpRateLimit[\s\S]*?validateAuth[\s\S]*?loginProgressiveDelay[\s\S]*?loginAccountRateLimit/
  );

  assert.match(
    routes,
    /['"]\/password-reset\/request['"][\s\S]*?passwordResetRequestIpRateLimit[\s\S]*?validateAuth[\s\S]*?passwordResetAccountRateLimit/
  );

  assert.match(
    routes,
    /['"]\/password-reset\/confirm['"][\s\S]*?passwordResetConfirmIpRateLimit[\s\S]*?validateAuth[\s\S]*?passwordResetTokenRateLimit/
  );

  assert.match(
    routes,
    /['"]\/current\/password['"][\s\S]*?authenticate[\s\S]*?passwordChangeIpRateLimit[\s\S]*?validateAuth[\s\S]*?passwordChangeProgressiveDelay[\s\S]*?passwordChangeAccountRateLimit/
  );
});
