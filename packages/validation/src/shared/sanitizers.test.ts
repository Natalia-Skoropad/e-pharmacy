import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBankNameError,
  buildEmailError,
  buildPhoneError,
  buildBankRecipientNameError,
  buildPharmacyNameError,
  buildPasswordError,
  buildTextEditorError,
  buildUserNameError,
} from './errors';

import {
  normalizePhoneInput,
  sanitizeEmail,
  validateNormalizedPhone,
} from './sanitizers';

//=============================================================================

test('password validation reports spaces without changing the input', () => {
  const value = 'my pass word';

  assert.equal(value, 'my pass word');
  assert.notEqual(buildPasswordError(value), '');
});

//=============================================================================

test('email sanitizer trims only surrounding whitespace', () => {
  assert.equal(sanitizeEmail('  john@example.com  '), 'john@example.com');
  assert.equal(sanitizeEmail('john @example.com'), 'john @example.com');
  assert.notEqual(buildEmailError(sanitizeEmail('john @example.com')), '');

  const tooLongEmail = `${'a'.repeat(60)}@example.com`;
  assert.equal(sanitizeEmail(tooLongEmail), tooLongEmail);
  assert.notEqual(buildEmailError(sanitizeEmail(tooLongEmail)), '');
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

  assert.equal(phoneWithExtraDigit, '+3805012345678');
  assert.equal(validateNormalizedPhone(phoneWithExtraDigit), false);
  assert.notEqual(buildPhoneError(phoneWithExtraDigit), '');
});

//=============================================================================

test('text editor validation accepts Ukrainian text unchanged', () => {
  const value = 'Опис препарату українською мовою — без втрати символів.';

  assert.equal(buildTextEditorError(value, { required: true }), '');
});

//=============================================================================

test('domain name validators accept Ukrainian names', () => {
  assert.equal(buildUserNameError('Наталія'), '');
  assert.equal(buildPharmacyNameError('Аптека Здоров’я'), '');
  assert.equal(buildBankRecipientNameError('ТОВ Аптека Здоров’я'), '');
  assert.equal(buildBankNameError('Банк Україна'), '');
});
