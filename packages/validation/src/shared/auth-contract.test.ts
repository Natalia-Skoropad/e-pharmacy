import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAddressError,
  buildEmailError,
  buildPasswordError,
  buildPhoneError,
} from './errors';

//=============================================================================

test('frontend auth validation accepts boundary values', () => {
  assert.equal(buildPasswordError('a'.repeat(8)), '');
  assert.equal(buildPasswordError('a'.repeat(20)), '');
  assert.equal(buildPhoneError('+380501234567'), '');
  assert.equal(buildAddressError('a'.repeat(10)), '');
  assert.equal(buildAddressError('a'.repeat(200)), '');
});

//=============================================================================

test('frontend auth validation rejects values outside boundaries', () => {
  assert.notEqual(buildPasswordError('a'.repeat(7)), '');
  assert.notEqual(buildPasswordError('a'.repeat(21)), '');
  assert.notEqual(buildPhoneError('0501234567'), '');
  assert.notEqual(buildAddressError('a'.repeat(9)), '');
  assert.notEqual(buildAddressError('a'.repeat(201)), '');
});

//=============================================================================

test('optional address accepts whitespace-only input', () => {
  assert.equal(buildAddressError('   '), '');
});

//=============================================================================

test('email validation handles valid, invalid and unicode input', () => {
  assert.equal(buildEmailError('user@example.com'), '');
  assert.notEqual(buildEmailError('invalid-email'), '');
  assert.notEqual(buildEmailError('користувач@example.com'), '');
});
