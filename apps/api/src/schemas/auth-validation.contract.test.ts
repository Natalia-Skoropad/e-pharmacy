import assert from 'node:assert/strict';
import test from 'node:test';

import { forgotPasswordSchema, loginSchema, registerSchema } from './auth.schema';

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

test('login requires an explicit public application binding', () => {
  assert.equal(
    loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password1',
    }).success,
    false
  );

  assert.equal(
    loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password1',
      application: 'client',
    }).success,
    true
  );
});

//===============================================================

test('public password recovery does not accept the future admin application', () => {
  const adminAttempts = [
    forgotPasswordSchema.safeParse({
      email: 'admin@example.com',
      application: 'admin',
    }),
    forgotPasswordSchema.safeParse({
      email: 'unknown-admin@example.com',
      application: 'admin',
    }),
  ];

  assert.equal(adminAttempts[0].success, false);
  assert.equal(adminAttempts[1].success, false);

  if (!adminAttempts[0].success && !adminAttempts[1].success) {
    assert.deepEqual(
      adminAttempts[0].error.issues.map(({ code, path }) => ({ code, path })),
      adminAttempts[1].error.issues.map(({ code, path }) => ({ code, path }))
    );
  }

  for (const application of ['client', 'pharmacy'] as const) {
    assert.equal(
      forgotPasswordSchema.safeParse({
        email: 'user@example.com',
        application,
      }).success,
      true
    );
  }
});
