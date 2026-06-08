import { AVATAR_ALLOWED_TYPES } from '../profile-avatar';

import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_AVATAR_FILE_MAX_SIZE_BYTES,
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
  AVATAR_DATA_URL_PATTERN,
  AVATAR_HTTP_URL_PATTERN,
  EMAIL_PATTERN,
  NAME_PATTERN,
  ORDER_COMMENT_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  REVIEW_COMMENT_PATTERN,
} from './patterns';

import { VALIDATION_MESSAGES } from './messages';

//=============================================================================

export function buildNameError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? VALIDATION_MESSAGES.required.name : '';

  if (name.length < USER_NAME_MIN_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.nameMin;
    return options.trailingDot ? `${message}.` : message;
  }

  if (name.length > USER_NAME_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.nameMax;
    return options.trailingDot ? `${message}.` : message;
  }

  if (!NAME_PATTERN.test(name)) {
    const message = VALIDATION_MESSAGES.format.name;
    return options.trailingDot ? `${message}.` : message;
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
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const phone = value.trim();

  if (!phone) return options.required ? VALIDATION_MESSAGES.required.phone : '';

  if (phone.length > USER_PHONE_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.phoneMax;
    return options.trailingDot ? `${message}.` : message;
  }

  if (!PHONE_PATTERN.test(phone)) {
    const message = VALIDATION_MESSAGES.format.phone;
    return options.trailingDot ? `${message}.` : message;
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
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const address = value.trim();

  if (!address) {
    return options.required ? VALIDATION_MESSAGES.required.address : '';
  }

  if (address.length < USER_ADDRESS_MIN_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.addressMin;
    return options.trailingDot ? `${message}.` : message;
  }

  if (address.length > USER_ADDRESS_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.addressMax;
    return options.trailingDot ? `${message}.` : message;
  }

  if (!ADDRESS_PATTERN.test(address)) {
    const message = VALIDATION_MESSAGES.format.address;
    return options.trailingDot ? `${message}.` : message;
  }

  return '';
}

//=============================================================================

export function buildReviewCommentError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.reviewComment : '';
  }

  if (comment.length < USER_REVIEW_COMMENT_MIN_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.reviewCommentMin;
    return options.trailingDot ? `${message}.` : message;
  }

  if (comment.length > USER_REVIEW_COMMENT_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.reviewCommentMax;
    return options.trailingDot ? `${message}.` : message;
  }

  if (!REVIEW_COMMENT_PATTERN.test(comment)) {
    const message = VALIDATION_MESSAGES.format.reviewComment;
    return options.trailingDot ? `${message}.` : message;
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
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.orderComment : '';
  }

  if (comment.length > USER_ORDER_COMMENT_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.orderCommentMax;
    return options.trailingDot ? `${message}.` : message;
  }

  if (!ORDER_COMMENT_PATTERN.test(comment)) {
    const message = VALIDATION_MESSAGES.format.orderComment;
    return options.trailingDot ? `${message}.` : message;
  }

  return '';
}

//=============================================================================

export function buildAvatarFileError(file: File): string {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type as never)) {
    return VALIDATION_MESSAGES.format.avatarFileType;
  }

  if (file.size > USER_AVATAR_FILE_MAX_SIZE_BYTES) {
    return VALIDATION_MESSAGES.limits.avatarFileSize;
  }

  return '';
}

//=============================================================================

export function buildAvatarUrlError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const avatarUrl = value.trim();

  if (!avatarUrl) {
    return options.required ? VALIDATION_MESSAGES.required.avatar : '';
  }

  if (avatarUrl.length > USER_AVATAR_URL_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.avatarPayloadMax;
    return options.trailingDot ? `${message}.` : message;
  }

  if (
    !AVATAR_DATA_URL_PATTERN.test(avatarUrl) &&
    !AVATAR_HTTP_URL_PATTERN.test(avatarUrl)
  ) {
    const message = VALIDATION_MESSAGES.format.avatar;
    return options.trailingDot ? `${message}.` : message;
  }

  return '';
}
