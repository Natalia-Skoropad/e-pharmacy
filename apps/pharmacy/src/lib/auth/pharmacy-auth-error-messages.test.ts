import assert from 'node:assert/strict';
import test from 'node:test';

import { getPharmacyPasswordChangeErrorMessage } from './pharmacy-auth-error-messages';

//===================================================================

test('password change maps invalid credentials to the current-password message', () => {
  assert.equal(
    getPharmacyPasswordChangeErrorMessage('invalid_credentials'),
    'Current password is incorrect.'
  );
});
