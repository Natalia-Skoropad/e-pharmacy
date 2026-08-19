import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import {
  BFF_AUTH_PROXY_HEADER_NAME,
  BFF_AUTH_PROXY_MARKER_VALUE,
  BFF_PROXY_SECRET_HEADER_NAME,
} from '../constants/bff';

//===================================================================

type AuthBffMiddlewareModule = {
  requireTrustedAuthProxy: (
    req: never,
    res: never,
    next: (error?: unknown) => void
  ) => void;
};

//===================================================================

async function loadMiddleware(): Promise<AuthBffMiddlewareModule> {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/e-pharmacy-test';
  process.env.JWT_SECRET ||= 'test-jwt-secret';
  process.env.BFF_PROXY_SECRET ||= 'test-bff-secret';

  const requireModule = createRequire(__filename);

  return requireModule('./auth-bff.middleware') as AuthBffMiddlewareModule;
}

//===================================================================

test('rejects direct auth-session requests before downstream middleware', async () => {
  const { requireTrustedAuthProxy } = await loadMiddleware();
  let nextCalls = 0;
  let nextError: unknown;

  requireTrustedAuthProxy(
    { headers: {} } as never,
    {} as never,
    (error?: unknown) => {
      nextCalls += 1;
      nextError = error;
    }
  );

  assert.equal(nextCalls, 1);
  assert.equal((nextError as { status?: number }).status, 403);
  assert.equal((nextError as { code?: string }).code, 'AUTH_FORBIDDEN_ORIGIN');
});

//===================================================================

test('allows only the marker plus the configured BFF secret', async () => {
  const { requireTrustedAuthProxy } = await loadMiddleware();
  let nextError: unknown = new Error('not called');

  requireTrustedAuthProxy(
    {
      headers: {
        [BFF_AUTH_PROXY_HEADER_NAME]: BFF_AUTH_PROXY_MARKER_VALUE,
        [BFF_PROXY_SECRET_HEADER_NAME]: process.env.BFF_PROXY_SECRET,
      },
    } as never,
    {} as never,
    (error?: unknown) => {
      nextError = error;
    }
  );

  assert.equal(nextError, undefined);
});
