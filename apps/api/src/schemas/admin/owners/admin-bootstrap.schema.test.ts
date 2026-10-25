import assert from 'node:assert/strict';
import test from 'node:test';

import { adminOwnerBootstrapSchema } from './admin-bootstrap.schema';

//===============================================================

const validInput = {
  name: 'Platform Owner',
  email: 'admin@example.com',
  password: 'password1',
  phone: '+380501234567',
};

//===============================================================

test('admin owner bootstrap validates and normalizes trusted input', () => {
  const parsed = adminOwnerBootstrapSchema.parse({
    ...validInput,
    email: ' Admin@Example.COM ',
    address: '  10 Main Street  ',
  });

  assert.equal(parsed.email, 'admin@example.com');
  assert.equal(parsed.address, '10 Main Street');
});

//===============================================================

test('admin owner bootstrap rejects invalid identity credentials', () => {
  assert.equal(
    adminOwnerBootstrapSchema.safeParse({ ...validInput, email: 'invalid' })
      .success,
    false
  );

  assert.equal(
    adminOwnerBootstrapSchema.safeParse({ ...validInput, password: 'short' })
      .success,
    false
  );

  assert.equal(
    adminOwnerBootstrapSchema.safeParse({ ...validInput, phone: 'invalid' })
      .success,
    false
  );
});
