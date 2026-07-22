import assert from 'node:assert/strict';
import test from 'node:test';

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from './auth.schema';

//===============================================================

test('login validates email but does not re-apply registration password rules', () => {
  assert.equal(
    loginSchema.safeParse({
      email: ' User@Example.COM ',
      password: 'stored secret',
      application: 'client',
    }).success,
    true
  );

  assert.equal(
    loginSchema.safeParse({ email: 'invalid email', password: 'secret' })
      .success,
    false
  );
});

//===============================================================

test('forgot and reset password schemas enforce application, token and new password', () => {
  assert.equal(
    forgotPasswordSchema.safeParse({
      email: 'user@example.com',
      application: 'client',
    }).success,
    true
  );

  assert.equal(
    forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success,
    false
  );

  assert.equal(
    resetPasswordSchema.safeParse({
      token: 'reset-token',
      newPassword: 'password1',
    }).success,
    true
  );

  assert.equal(
    resetPasswordSchema.safeParse({ token: '', newPassword: 'password1' })
      .success,
    false
  );
});

//===============================================================

test('profile updates reject payloads without meaningful values', () => {
  assert.equal(updateProfileSchema.safeParse({}).success, false);
  assert.equal(
    updateProfileSchema.safeParse({ address: '   ' }).success,
    false
  );
  assert.equal(
    updateProfileSchema.safeParse({ pictureUrl: null }).success,
    true
  );

  assert.equal(
    updateProfileSchema.safeParse({ name: 'Natalia' }).success,
    true
  );
});

//===============================================================

test('password update requires current password and a valid new password', () => {
  assert.equal(
    updatePasswordSchema.safeParse({
      currentPassword: 'current password',
      newPassword: 'newpassword1',
    }).success,
    true
  );

  assert.equal(
    updatePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'newpassword1',
    }).success,
    false
  );
});
