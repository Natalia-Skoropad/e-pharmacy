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
        'content-length': '999',
        'transfer-encoding': 'chunked',
        origin: 'https://client.example',
        referer: 'https://client.example/orders?tab=new',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        tracestate: 'vendor=value',
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
    assert.equal(headers.get('content-length'), null);
    assert.equal(headers.get('transfer-encoding'), null);
    assert.equal(headers.get('origin'), 'https://client.example');

    assert.equal(
      headers.get('referer'),
      'https://client.example/orders?tab=new'
    );

    assert.equal(
      headers.get('traceparent'),
      '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

//===================================================================

test('drops malformed context and never trusts browser marker, secret, request id, or IP', () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    BFF_PROXY_SECRET: process.env.BFF_PROXY_SECRET,
  };

  try {
    process.env.NODE_ENV = 'production';
    process.env.API_BASE_URL = 'https://backend.example';
    process.env.BFF_PROXY_SECRET = 'server-secret';

    const request = {
      headers: new Headers({
        origin: 'javascript:alert(1)',
        referer: 'https://user:password@example.com/path',
        'x-forwarded-for': '198.51.100.9',
        'x-vercel-forwarded-for': 'not-an-ip',
        [REQUEST_ID_HEADER_NAME]: 'browser-request-id',
        [BFF_AUTH_PROXY_HEADER_NAME]: 'browser-marker',
        [BFF_PROXY_SECRET_HEADER_NAME]: 'browser-secret',
        [DEVICE_NAME_HEADER_NAME]: 'x'.repeat(121),
        traceparent: 'invalid',
        tracestate: 'bad(state)',
      }),
    } as NextRequest;

    const headers = createProxyRequestHeaders(request, {
      authCookieMode: 'none',
      requestId: 'generated-request-id',
      includeAuthProxyMarker: true,
    });

    assert.equal(headers.get(REQUEST_ID_HEADER_NAME), 'generated-request-id');

    assert.equal(
      headers.get(BFF_AUTH_PROXY_HEADER_NAME),
      BFF_AUTH_PROXY_MARKER_VALUE
    );

    assert.equal(headers.get(BFF_PROXY_SECRET_HEADER_NAME), 'server-secret');
    assert.equal(headers.get('origin'), null);
    assert.equal(headers.get('referer'), null);
    assert.equal(headers.get('x-forwarded-for'), null);
    assert.equal(headers.get(DEVICE_NAME_HEADER_NAME), null);
    assert.equal(headers.get('traceparent'), null);
    assert.equal(headers.get('tracestate'), null);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
