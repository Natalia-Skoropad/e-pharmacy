import assert from 'node:assert/strict';
import test from 'node:test';

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from './auth.schema';

//===============================================================

const basePayload = {
  name: 'Valid User',
  email: 'user@example.com',
  password: 'password1',
  phone: '+380501234567',
  role: 'client' as const,
};

//===============================================================

test('optional registration address normalizes empty values', () => {
  assert.equal(
    registerSchema.parse({ ...basePayload, address: '' }).address,
    undefined
  );

  assert.equal(
    registerSchema.parse({ ...basePayload, address: '   ' }).address,
    undefined
  );
});

//===============================================================

test('optional registration address trims valid values', () => {
  assert.equal(
    registerSchema.parse({ ...basePayload, address: '  10 Main Street  ' })
      .address,
    '10 Main Street'
  );
});

//===============================================================

test('registration address enforces boundaries after trimming', () => {
  assert.equal(
    registerSchema.safeParse({ ...basePayload, address: '123456789' }).success,
    false
  );

  assert.equal(
    registerSchema.safeParse({ ...basePayload, address: 'a'.repeat(201) })
      .success,
    false
  );
});

//===============================================================

test('public registration rejects the admin role', () => {
  assert.equal(
    registerSchema.safeParse({ ...basePayload, role: 'admin' }).success,
    false
  );
});

//===============================================================

test('login requires an explicit supported application binding', () => {
  assert.equal(
    loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password1',
    }).success,
    false
  );

  for (const application of ['client', 'pharmacy', 'admin'] as const) {
    assert.equal(
      loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password1',
        application,
      }).success,
      true
    );
  }

  assert.equal(
    loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password1',
      application: 'supplier',
    }).success,
    false
  );
});

//===============================================================

test('password recovery accepts every supported auth application', () => {
  for (const application of ['client', 'pharmacy', 'admin'] as const) {
    assert.equal(
      forgotPasswordSchema.safeParse({
        email: 'user@example.com',
        application,
      }).success,
      true
    );
  }

  assert.equal(
    forgotPasswordSchema.safeParse({
      email: 'user@example.com',
      application: 'supplier',
    }).success,
    false
  );
});
