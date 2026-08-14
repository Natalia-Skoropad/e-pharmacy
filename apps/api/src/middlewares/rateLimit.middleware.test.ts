import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

test('distributed auth rate limiting uses Mongo instead of process-local buckets', () => {
  const middleware = readFileSync(
    resolve(__dirname, './rateLimit.middleware.ts'),
    'utf8'
  );

  const store = readFileSync(
    resolve(__dirname, '../services/rate-limit-store.service.ts'),
    'utf8'
  );

  const model = readFileSync(
    resolve(__dirname, '../models/rateLimitBucket.model.ts'),
    'utf8'
  );

  assert.doesNotMatch(middleware, /new Map[<(]/);
  assert.doesNotMatch(middleware, /MAX_PROGRESSIVE_DELAY_BUCKETS/);
  assert.match(middleware, /incrementRateLimitCounter/);
  assert.match(store, /findOneAndUpdate/);
  assert.match(model, /expireAfterSeconds:\s*0/);
});

//===================================================================

test('auth routes combine IP and account dimensions for credential-sensitive flows', () => {
  const routes = readFileSync(
    resolve(__dirname, '../routes/auth.routes.ts'),
    'utf8'
  );

  const middleware = readFileSync(
    resolve(__dirname, './rateLimit.middleware.ts'),
    'utf8'
  );

  assert.match(
    middleware,
    /function getEmailIpKey[\s\S]*?getEmailKey\(req, res\)[\s\S]*?getIpKey\(req\)[\s\S]*?emailKey && ipKey/
  );
  assert.doesNotMatch(
    middleware,
    /export const loginAccountRateLimit/
  );

  assert.match(
    routes,
    /['"]\/pharmacy-documents\/session['"][\s\S]*?registrationDocumentSessionIpRateLimit/
  );

  assert.match(
    routes,
    /['"]\/login['"][\s\S]*?loginIpRateLimit[\s\S]*?validateAuth[\s\S]*?loginProgressiveDelay[\s\S]*?loginAccountIpRateLimit/
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
