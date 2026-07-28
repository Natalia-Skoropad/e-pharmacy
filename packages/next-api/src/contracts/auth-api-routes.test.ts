import assert from 'node:assert/strict';
import test from 'node:test';

import { localAuthApiRoutes } from './auth-api-routes';

//===================================================================

test('owns shared same-origin auth BFF routes in next-api', () => {
  assert.equal(localAuthApiRoutes.login, '/api/auth/login');
  assert.equal(localAuthApiRoutes.current, '/api/auth/me');
  assert.equal(
    localAuthApiRoutes.session('64b64b64b64b64b64b64b64b'),
    '/api/auth/sessions/64b64b64b64b64b64b64b64b'
  );
});
