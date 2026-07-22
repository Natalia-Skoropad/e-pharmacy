import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isChangePasswordFormValid,
  isDataProfileFormValid,
  normalizeDataProfileValues,
  validateChangePasswordForm,
} from './user-profile-validation';

//===================================================================

test('user profile validation trims values without changing their meaning', () => {
  const values = {
    name: '  Natalia  ',
    phone: '+380501234567',
    address: '  Kyiv, Main Street 10  ',
  };

  assert.equal(isDataProfileFormValid(values), true);

  assert.deepEqual(normalizeDataProfileValues(values), {
    name: 'Natalia',
    phone: '+380501234567',
    address: 'Kyiv, Main Street 10',
  });
});

//===================================================================

test('password update requires both current and valid new password', () => {
  assert.equal(
    isChangePasswordFormValid({
      currentPassword: 'current-password',
      newPassword: 'newpassword1',
    }),
    true
  );

  assert.notDeepEqual(
    validateChangePasswordForm({
      currentPassword: '',
      newPassword: 'newpassword1',
    }),
    {}
  );
});
