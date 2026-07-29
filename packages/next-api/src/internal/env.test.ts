import assert from 'node:assert/strict';
import test from 'node:test';

import { getNextApiServerEnvironment } from './env.ts';

//===================================================================

test('production requires an HTTPS backend URL and BFF proxy secret', () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    BFF_PROXY_SECRET: process.env.BFF_PROXY_SECRET,
  };

  try {
    process.env.NODE_ENV = 'production';
    process.env.API_BASE_URL = 'https://api.example.com';
    delete process.env.BFF_PROXY_SECRET;

    assert.throws(
      () => getNextApiServerEnvironment(),
      /BFF_PROXY_SECRET is required/
    );

    process.env.BFF_PROXY_SECRET = 'deployment-secret';
    assert.equal(
      getNextApiServerEnvironment().bffProxySecret,
      'deployment-secret'
    );

    process.env.API_BASE_URL = 'http://api.example.com';
    assert.throws(
      () => getNextApiServerEnvironment(),
      /must use https in production/
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

//===================================================================

test('rejects invalid SameSite and cookie-domain configuration', () => {
  const previous = { ...process.env };

  try {
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = 'http://backend.example';
    process.env.AUTH_COOKIE_SAME_SITE = 'sometimes';
    assert.throws(() => getNextApiServerEnvironment(), /AUTH_COOKIE_SAME_SITE/);

    process.env.AUTH_COOKIE_SAME_SITE = 'lax';
    process.env.AUTH_COOKIE_DOMAIN = 'https://example.com/path';
    assert.throws(() => getNextApiServerEnvironment(), /AUTH_COOKIE_DOMAIN/);

    delete process.env.AUTH_COOKIE_DOMAIN;
    process.env.AUTH_COOKIE_LEGACY_DOMAINS = '.old.example.com,old.example.com';

    assert.deepEqual(getNextApiServerEnvironment().authCookieLegacyDomains, [
      '.old.example.com',
      'old.example.com',
    ]);
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) delete process.env[key];
    }

    Object.assign(process.env, previous);
  }
});

//===================================================================

test('trusted client IP forwarding requires an explicit proxy provider', () => {
  const previous = { ...process.env };

  try {
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = 'http://backend.example';

    delete process.env.BFF_TRUSTED_PROXY_PROVIDER;
    assert.equal(getNextApiServerEnvironment().trustedProxyProvider, 'none');

    process.env.BFF_TRUSTED_PROXY_PROVIDER = 'vercel';
    assert.equal(getNextApiServerEnvironment().trustedProxyProvider, 'vercel');

    process.env.BFF_TRUSTED_PROXY_PROVIDER = 'cloudflare';
    assert.equal(
      getNextApiServerEnvironment().trustedProxyProvider,
      'cloudflare'
    );

    process.env.BFF_TRUSTED_PROXY_PROVIDER = 'browser-header';
    assert.throws(
      () => getNextApiServerEnvironment(),
      /BFF_TRUSTED_PROXY_PROVIDER/
    );
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) delete process.env[key];
    }

    Object.assign(process.env, previous);
  }
});
