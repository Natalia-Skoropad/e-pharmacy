import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  TEXT_EDITOR_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_REVIEW_COMMENT_MIN_LENGTH,
} from './limits';

import {
  ADDRESS_PATTERN,
  EMAIL_PATTERN,
  ORDER_COMMENT_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  REVIEW_COMMENT_PATTERN,
  TEXT_EDITOR_PATTERN,
  USER_NAME_PATTERN,
} from './patterns';

import { VALIDATION_MESSAGES } from './messages';

//=============================================================================

type OptionalFieldOptions = Readonly<{ required?: boolean }>;

//=============================================================================

export function buildUserNameError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? VALIDATION_MESSAGES.required.name : '';
  if (name.length < USER_NAME_MIN_LENGTH) {
    return VALIDATION_MESSAGES.limits.nameMin;
  }

  if (name.length > USER_NAME_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.nameMax;
  }

  if (!USER_NAME_PATTERN.test(name)) return VALIDATION_MESSAGES.format.name;

  return '';
}

//=============================================================================

export function buildEmailError(value: string): string {
  const email = value.trim();

  if (!email) return VALIDATION_MESSAGES.required.email;
  if (email.length > USER_EMAIL_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.emailMax;
  }

  if (!EMAIL_PATTERN.test(email)) return VALIDATION_MESSAGES.format.email;

  return '';
}

//=============================================================================

export function buildPhoneError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const phone = value.trim();

  if (!phone) return options.required ? VALIDATION_MESSAGES.required.phone : '';
  if (phone.length > USER_PHONE_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.phoneMax;
  }

  if (!PHONE_PATTERN.test(phone)) return VALIDATION_MESSAGES.format.phone;

  return '';
}

//=============================================================================

export function buildPasswordError(value: string): string {
  if (!value) return VALIDATION_MESSAGES.required.password;
  if (value.length < USER_PASSWORD_MIN_LENGTH) {
    return VALIDATION_MESSAGES.limits.passwordMin;
  }

  if (value.length > USER_PASSWORD_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.passwordMax;
  }

  if (!PASSWORD_PATTERN.test(value)) {
    return VALIDATION_MESSAGES.format.password;
  }

  return '';
}

//=============================================================================

export function buildRequiredPasswordError(
  value: string,
  message: string = VALIDATION_MESSAGES.required.password
): string {
  return value ? '' : message;
}

//=============================================================================

export function buildAddressError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const address = value.trim();

  if (!address) {
    return options.required ? VALIDATION_MESSAGES.required.address : '';
  }

  if (address.length < USER_ADDRESS_MIN_LENGTH) {
    return VALIDATION_MESSAGES.limits.addressMin;
  }

  if (address.length > USER_ADDRESS_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.addressMax;
  }

  if (!ADDRESS_PATTERN.test(address)) {
    return VALIDATION_MESSAGES.format.address;
  }

  return '';
}

//=============================================================================

export function buildReviewCommentError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.reviewComment : '';
  }

  if (comment.length < USER_REVIEW_COMMENT_MIN_LENGTH) {
    return VALIDATION_MESSAGES.limits.reviewCommentMin;
  }

  if (comment.length > USER_REVIEW_COMMENT_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.reviewCommentMax;
  }

  if (!REVIEW_COMMENT_PATTERN.test(comment)) {
    return VALIDATION_MESSAGES.format.reviewComment;
  }

  return '';
}

//=============================================================================

export function buildReviewRatingError(value: number): string {
  return Number.isInteger(value) &&
    value >= MIN_REVIEW_RATING &&
    value <= MAX_REVIEW_RATING
    ? ''
    : VALIDATION_MESSAGES.format.reviewRating;
}

//=============================================================================

export function buildOrderCommentError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.orderComment : '';
  }

  if (comment.length > USER_ORDER_COMMENT_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.orderCommentMax;
  }

  if (!ORDER_COMMENT_PATTERN.test(comment)) {
    return VALIDATION_MESSAGES.format.orderComment;
  }

  return '';
}

//=============================================================================

export function buildTextEditorError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const text = value.trim();

  if (!text) {
    return options.required ? VALIDATION_MESSAGES.required.textEditor : '';
  }

  if (text.length > TEXT_EDITOR_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.textEditorMax;
  }

  if (!TEXT_EDITOR_PATTERN.test(text)) {
    return VALIDATION_MESSAGES.format.textEditor;
  }

  return '';
}
