import assert from 'node:assert/strict';
import test from 'node:test';

import type { NextFunction, Request, Response } from 'express';

import { attachRequestContext } from './request-context.middleware';

//===============================================================

test('traceparent preserves correlation without requiring x-request-id', () => {
  const headers = new Map<string, string>([
    ['traceparent', '00-123e4567e89b12d3a456426614174000-0123456789abcdef-01'],
  ]);

  const req = {
    method: 'GET',
    path: '/products',
    get: (name: string) => headers.get(name.toLowerCase()),
  } as unknown as Request;

  const responseHeaders = new Map<string, string>();

  const res = {
    locals: {},
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      responseHeaders.set(name.toLowerCase(), value);
    },
    on: () => res,
  } as unknown as Response;

  let nextCalled = false;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  attachRequestContext(req, res, next);

  const expectedRequestId = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(res.locals.requestId, expectedRequestId);
  assert.equal(responseHeaders.get('x-request-id'), expectedRequestId);
  assert.equal(nextCalled, true);
});
