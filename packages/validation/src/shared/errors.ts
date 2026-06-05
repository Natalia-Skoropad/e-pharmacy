import { isAvatarDataUrl, isHttpUrl } from './assets';

import {
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_AVATAR_URL_MAX_LENGTH,
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
  NAME_PATTERN,
  ORDER_COMMENT_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  REVIEW_COMMENT_PATTERN,
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

export function buildNameError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? VALIDATION_MESSAGES.required.name : '';

  if (name.length < USER_NAME_MIN_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.nameMin,
      options.trailingDot
    );
  }

  if (name.length > USER_NAME_MAX_LENGTH) {
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
  options: TextFieldErrorOptions = {}
): string {
  const phone = value.trim();

  if (!phone) return options.required ? VALIDATION_MESSAGES.required.phone : '';

  if (phone.length > USER_PHONE_MAX_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.phoneMax,
      options.trailingDot
    );
  }

  if (!PHONE_PATTERN.test(phone)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.phone,
      options.trailingDot
    );
  }

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

export function buildAddressError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const address = value.trim();

  if (!address) {
    return options.required ? VALIDATION_MESSAGES.required.address : '';
  }

  if (address.length < USER_ADDRESS_MIN_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.addressMin,
      options.trailingDot
    );
  }

  if (address.length > USER_ADDRESS_MAX_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.addressMax,
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

//=============================================================================

export function buildReviewCommentError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.reviewComment : '';
  }

  if (comment.length < USER_REVIEW_COMMENT_MIN_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.reviewCommentMin,
      options.trailingDot
    );
  }

  if (comment.length > USER_REVIEW_COMMENT_MAX_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.reviewCommentMax,
      options.trailingDot
    );
  }

  if (!REVIEW_COMMENT_PATTERN.test(comment)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.reviewComment,
      options.trailingDot
    );
  }

  return '';
}

//=============================================================================

export function buildOrderCommentError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.orderComment : '';
  }

  if (comment.length > USER_ORDER_COMMENT_MAX_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.orderCommentMax,
      options.trailingDot
    );
  }

  if (!ORDER_COMMENT_PATTERN.test(comment)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.orderComment,
      options.trailingDot
    );
  }

  return '';
}

//=============================================================================

export function buildAvatarUrlError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const avatarUrl = value.trim();

  if (!avatarUrl) {
    return options.required ? VALIDATION_MESSAGES.required.avatar : '';
  }

  if (avatarUrl.length > USER_AVATAR_URL_MAX_LENGTH) {
    return withTrailingDot(
      VALIDATION_MESSAGES.limits.avatarMax,
      options.trailingDot
    );
  }

  if (!isAvatarDataUrl(avatarUrl) && !isHttpUrl(avatarUrl)) {
    return withTrailingDot(
      VALIDATION_MESSAGES.format.avatar,
      options.trailingDot
    );
  }

  return '';
}
