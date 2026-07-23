import {
  IBAN_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  TAX_ID_MIN_LENGTH,
} from '../shared/limits';

//===================================================================

export const IBAN_INPUT_ATTRIBUTES = Object.freeze({
  maxLength: IBAN_MAX_LENGTH,
  pattern: 'UA[0-9]{27}',
  placeholder: 'UA123456789012345678901234567',
  hint: 'Use the Ukrainian IBAN format: UA + 27 digits.',
});

//===================================================================

export const TAX_ID_INPUT_ATTRIBUTES = Object.freeze({
  minLength: TAX_ID_MIN_LENGTH,
  maxLength: TAX_ID_MAX_LENGTH,
  pattern: `[0-9]{${TAX_ID_MIN_LENGTH},${TAX_ID_MAX_LENGTH}}`,
  placeholder: '12345678',
  hint: `Use ${TAX_ID_MIN_LENGTH}–${TAX_ID_MAX_LENGTH} digits.`,
});
