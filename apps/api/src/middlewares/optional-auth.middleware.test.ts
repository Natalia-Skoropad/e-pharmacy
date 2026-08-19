import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

//===================================================================

type OptionalAuthenticate = (
  req: never,
  res: never,
  next: (error?: unknown) => void
) => Promise<void>;

type AuthMiddlewareModule = {
  optionalAuthenticate: OptionalAuthenticate;
};

//===================================================================

async function loadOptionalAuthenticate(): Promise<OptionalAuthenticate> {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/e-pharmacy-test';
  process.env.JWT_SECRET ||= 'test-jwt-secret';
  process.env.BFF_PROXY_SECRET ||= 'test-bff-secret';

  const requireModule = createRequire(__filename);
  const module = requireModule('./auth.middleware') as AuthMiddlewareModule;

  return module.optionalAuthenticate;
}

//===================================================================

test('optional auth stays anonymous when no access token candidate exists', async () => {
  const optionalAuthenticate = await loadOptionalAuthenticate();
  let nextError: unknown = new Error('not called');

  await optionalAuthenticate(
    { headers: {} } as never,
    {} as never,
    (error?: unknown) => {
      nextError = error;
    }
  );

  assert.equal(nextError, undefined);
});

//===================================================================

test('optional auth surfaces an invalid presented access token as AUTH_SESSION_INVALID', async () => {
  const optionalAuthenticate = await loadOptionalAuthenticate();
  let nextError: unknown;

  await optionalAuthenticate(
    {
      headers: {
        cookie: 'e_pharmacy_access_token=definitely-not-a-valid-jwt',
      },
    } as never,
    {} as never,
    (error?: unknown) => {
      nextError = error;
    }
  );

  assert.equal((nextError as { status?: number }).status, 401);
  assert.equal((nextError as { code?: string }).code, 'AUTH_SESSION_INVALID');
});
