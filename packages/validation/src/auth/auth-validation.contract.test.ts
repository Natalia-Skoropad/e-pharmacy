import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isForgotPasswordFormValid,
  isLoginFormValid,
  isRegisterFormValid,
  isResetPasswordFormValid,
  validateResetPasswordForm,
} from './auth-validation';

//===================================================================

const validRegistration = {
  name: 'Natalia',
  email: 'user@example.com',
  phone: '+380501234567',
  password: 'password1',
};

//===================================================================

test('registration, login and password recovery use the same auth boundaries', () => {
  assert.equal(isRegisterFormValid(validRegistration), true);

  assert.equal(
    isRegisterFormValid({ ...validRegistration, password: 'short' }),
    false
  );

  assert.equal(
    isLoginFormValid({ email: 'user@example.com', password: 'stored-secret' }),
    true
  );

  assert.equal(
    isLoginFormValid({ email: 'invalid email', password: 'stored-secret' }),
    false
  );

  assert.equal(isForgotPasswordFormValid({ email: 'user@example.com' }), true);
});

//===================================================================

test('password reset requires matching valid passwords and a token', () => {
  const values = {
    password: 'password1',
    confirmPassword: 'password1',
  };

  assert.deepEqual(validateResetPasswordForm(values), {});
  assert.equal(isResetPasswordFormValid(values, 'reset-token'), true);
  assert.equal(isResetPasswordFormValid(values, ''), false);

  assert.notDeepEqual(
    validateResetPasswordForm({ ...values, confirmPassword: 'password2' }),
    {}
  );
});
