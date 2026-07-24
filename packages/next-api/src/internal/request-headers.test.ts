import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextRequest } from 'next/server';

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@e-pharmacy/config/auth';

import {
  BFF_AUTH_PROXY_HEADER_NAME,
  BFF_AUTH_PROXY_MARKER_VALUE,
  BFF_PROXY_SECRET_HEADER_NAME,
  DEVICE_NAME_HEADER_NAME,
  REQUEST_ID_HEADER_NAME,
} from './bff-contract.ts';

import { createProxyRequestHeaders } from './request-headers.ts';

//===================================================================

test('generates trusted security headers and forwards only allowlisted context', () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    BFF_PROXY_SECRET: process.env.BFF_PROXY_SECRET,
  };

  try {
    process.env.NODE_ENV = 'test';
    process.env.API_BASE_URL = 'http://backend.example';
    process.env.BFF_PROXY_SECRET = 'server-owned-secret';

    const request = {
      headers: new Headers({
        accept: 'application/json',
        cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access; ${REFRESH_TOKEN_COOKIE_NAME}=refresh; analytics=drop`,
        'user-agent': 'Test Browser',
        [DEVICE_NAME_HEADER_NAME]: 'Laptop',
        'x-vercel-forwarded-for': '203.0.113.10',
        [BFF_AUTH_PROXY_HEADER_NAME]: 'browser-spoof',
        [BFF_PROXY_SECRET_HEADER_NAME]: 'browser-secret',
      }),
    } as NextRequest;

    const headers = createProxyRequestHeaders(request, {
      authCookieMode: 'access-only',
      requestId: 'request-123',
      forwardAccept: true,
      includeAuthProxyMarker: true,
    });

    assert.equal(
      headers.get(BFF_AUTH_PROXY_HEADER_NAME),
      BFF_AUTH_PROXY_MARKER_VALUE
    );
    assert.equal(
      headers.get(BFF_PROXY_SECRET_HEADER_NAME),
      'server-owned-secret'
    );
    assert.equal(headers.get(REQUEST_ID_HEADER_NAME), 'request-123');
    assert.equal(headers.get('user-agent'), 'Test Browser');
    assert.equal(headers.get(DEVICE_NAME_HEADER_NAME), 'Laptop');
    assert.equal(headers.get('x-forwarded-for'), '203.0.113.10');
    assert.equal(headers.get('cookie'), `${ACCESS_TOKEN_COOKIE_NAME}=access`);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
