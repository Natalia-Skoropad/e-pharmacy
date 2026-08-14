import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest, NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_READY_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import {
  clearClientAuthCookies,
  setClientAuthCookies,
} from './auth-cookies.ts';

//===================================================================

function configureEnvironment(): () => void {
  const previous = { ...process.env };
  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://backend.example';
  process.env.BFF_PROXY_SECRET = 'test-secret';
  process.env.AUTH_COOKIE_DOMAIN = '.example.com';
  process.env.AUTH_COOKIE_LEGACY_DOMAINS = '.old.example.com';
  process.env.AUTH_COOKIE_SAME_SITE = 'strict';

  return () => {
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) delete process.env[key];
    }
    Object.assign(process.env, previous);
  };
}

//===================================================================

test('uses backend expiry metadata for access, refresh, and hint cookies', () => {
  const restore = configureEnvironment();

  try {
    const request = new NextRequest('https://client.example/api/auth/login');
    const response = NextResponse.json({ ok: true });

    setClientAuthCookies(response, request, {
      accessToken: 'access',
      refreshToken: 'refresh',
      accessTokenExpiresIn: 321,
      refreshTokenExpiresIn: 654,
    });

    const header = response.headers.get('set-cookie') ?? '';
    assert.match(header, new RegExp(ACCESS_TOKEN_COOKIE_NAME));
    assert.match(header, new RegExp(REFRESH_TOKEN_COOKIE_NAME));
    assert.match(header, new RegExp(AUTH_READY_COOKIE_NAME));
    assert.match(header, /Max-Age=321/);
    assert.match(header, /Max-Age=654/);
    assert.match(header, /SameSite=strict/i);
    assert.match(header, /Secure/i);
  } finally {
    restore();
  }
});

//===================================================================

test('clears host-only, current-domain, and legacy-domain variants', () => {
  const restore = configureEnvironment();

  try {
    const request = new NextRequest('https://client.example/api/auth/logout');
    const response = NextResponse.json({ ok: true });

    clearClientAuthCookies(response, request);

    const header = response.headers.get('set-cookie') ?? '';
    assert.match(header, /Max-Age=0/);
    assert.match(header, /Domain=\.example\.com/i);
    assert.match(header, /Domain=\.old\.example\.com/i);
  } finally {
    restore();
  }
});
