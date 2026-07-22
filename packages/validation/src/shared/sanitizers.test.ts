import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildEmailError,
  buildPhoneError,
  buildPasswordError,
  buildTextEditorError,
  buildUserNameError,
} from './errors';

import {
  buildBankNameError,
  buildBankRecipientNameError,
  buildPharmacyNameError,
} from '../profile/pharmacy-field-errors';

import {
  normalizePhoneInput,
  normalizeEmail,
  normalizeIban,
  validateNormalizedPhone,
} from './sanitizers';

//=============================================================================

test('password validation reports spaces without changing the input', () => {
  const value = 'my pass word';

  assert.equal(value, 'my pass word');
  assert.notEqual(buildPasswordError(value), '');
});

//=============================================================================

test('email normalization trims surrounding whitespace and lowercases', () => {
  assert.equal(normalizeEmail('  John@Example.COM  '), 'john@example.com');
  assert.equal(normalizeEmail('john @example.com'), 'john @example.com');
  assert.notEqual(buildEmailError(normalizeEmail('john @example.com')), '');
});


//=============================================================================

test('IBAN normalization removes spaces and uppercases the value', () => {
  assert.equal(
    normalizeIban(' ua12 3456789012345678901234567 '),
    'UA123456789012345678901234567'
  );
});

//=============================================================================

test('phone input normalization removes presentation formatting only', () => {
  assert.equal(normalizePhoneInput('+380 50 123 45 67'), '+380501234567');
  assert.equal(normalizePhoneInput('380 (50) 123-45-67'), '+380501234567');
  assert.equal(validateNormalizedPhone('+380501234567'), true);
});

//=============================================================================

test('phone input normalization does not hide invalid values', () => {
  const phoneWithLetters = normalizePhoneInput('+38050abc4567');
  const phoneWithExtraDigit = normalizePhoneInput('+3805012345678');

  assert.equal(phoneWithLetters, '+38050abc4567');
  assert.equal(validateNormalizedPhone(phoneWithLetters), false);
  assert.notEqual(buildPhoneError(phoneWithLetters), '');
  assert.equal(validateNormalizedPhone(phoneWithExtraDigit), false);
});

//=============================================================================

test('English-only text validation rejects Cyrillic without sanitizing it', () => {
  const value = 'Опис препарату українською мовою.';

  assert.notEqual(buildTextEditorError(value, { required: true }), '');
  assert.equal(value, 'Опис препарату українською мовою.');
});

//=============================================================================

test('domain name validators accept English and reject Cyrillic', () => {
  assert.equal(buildUserNameError('Natalia'), '');
  assert.equal(buildPharmacyNameError('Health Pharmacy'), '');
  assert.equal(buildBankRecipientNameError('Health Pharmacy LLC'), '');
  assert.equal(buildBankNameError('Example Bank'), '');

  assert.notEqual(buildUserNameError('Наталія'), '');
  assert.notEqual(buildPharmacyNameError('Аптека'), '');
  assert.notEqual(buildBankRecipientNameError('ТОВ Аптека'), '');
  assert.notEqual(buildBankNameError('Банк'), '');
});
