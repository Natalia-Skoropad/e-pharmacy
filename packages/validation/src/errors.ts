import { VALIDATION_LIMITS } from './limits';

import {
  ADDRESS_PATTERN,
  EMAIL_PATTERN,
  NAME_PATTERN,
  PHONE_PATTERN,
} from './patterns';

import { VALIDATION_MESSAGES } from './messages';

//=============================================================================

type TextFieldErrorOptions = {
  required?: boolean;
  trailingDot?: boolean;
};

//=============================================================================

function withTrailingDot(message: string, trailingDot?: boolean): string {
  return trailingDot ? `${message}.` : message;
}

//=============================================================================

export function buildEmailError(value: string): string {
  const email = value.trim();

  if (!email) return VALIDATION_MESSAGES.required.email;

  if (email.length > VALIDATION_LIMITS.emailMax) {
    return VALIDATION_MESSAGES.limits.emailMax;
  }

  if (!EMAIL_PATTERN.test(email)) return VALIDATION_MESSAGES.format.email;

  return '';
}

//=============================================================================

export function buildPasswordError(value: string): string {
  if (!value) return VALIDATION_MESSAGES.required.password;

  if (value.length < VALIDATION_LIMITS.passwordMin) {
    return VALIDATION_MESSAGES.limits.passwordMin;
  }

  if (value.length > VALIDATION_LIMITS.passwordMax) {
    return VALIDATION_MESSAGES.limits.passwordMax;
  }

  return '';
}

//=============================================================================

export function buildNameError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? VALIDATION_MESSAGES.required.name : '';

  if (name.length < VALIDATION_LIMITS.nameMin) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.nameMin,
      options.trailingDot
    );
  }

  if (name.length > VALIDATION_LIMITS.nameMax) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.nameMax,
      options.trailingDot
    );
  }

  if (!NAME_PATTERN.test(name)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.name,
      options.trailingDot
    );
  }

  return '';
}

//=============================================================================

export function buildPhoneError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const phone = value.trim();

  if (!phone) return options.required ? VALIDATION_MESSAGES.required.phone : '';

  if (!PHONE_PATTERN.test(phone)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.phone,
      options.trailingDot
    );
  }

  return '';
}

//=============================================================================

export function buildAddressError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const address = value.trim();

  if (!address)
    return options.required ? VALIDATION_MESSAGES.required.address : '';

  if (address.length < VALIDATION_LIMITS.addressMin) {
    return withTrailingDot(
      `Address must be at least ${VALIDATION_LIMITS.addressMin} characters`,
      options.trailingDot
    );
  }

  if (address.length > VALIDATION_LIMITS.addressMax) {
    return withTrailingDot(
      `Address must be at most ${VALIDATION_LIMITS.addressMax} characters`,
      options.trailingDot
    );
  }

  if (!ADDRESS_PATTERN.test(address)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.address,
      options.trailingDot
    );
  }

  return '';
}
