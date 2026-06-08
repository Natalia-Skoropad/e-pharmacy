import { PICTURE_ALLOWED_TYPES, isHttpUrl } from '../picture';

import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  PICTURE_FILE_MAX_SIZE_BYTES,
  PICTURE_URL_MAX_LENGTH,
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
  PICTURE_DATA_URL_PATTERN,
  EMAIL_PATTERN,
  NAME_PATTERN,
  ORDER_COMMENT_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  REVIEW_COMMENT_PATTERN,
} from './patterns';

import { VALIDATION_MESSAGES } from './messages';

//=============================================================================

function formatValidationMessage(
  message: string,
  options: { trailingDot?: boolean } = {}
): string {
  return options.trailingDot ? `${message}.` : message;
}

//=============================================================================

export function buildNameError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? VALIDATION_MESSAGES.required.name : '';

  if (name.length < USER_NAME_MIN_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.nameMin;
    return formatValidationMessage(message, options);
  }

  if (name.length > USER_NAME_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.nameMax;
    return formatValidationMessage(message, options);
  }

  if (!NAME_PATTERN.test(name)) {
    const message = VALIDATION_MESSAGES.format.name;
    return formatValidationMessage(message, options);
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
    return formatValidationMessage(message, options);
  }

  if (!PHONE_PATTERN.test(phone)) {
    const message = VALIDATION_MESSAGES.format.phone;
    return formatValidationMessage(message, options);
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
    return formatValidationMessage(message, options);
  }

  if (address.length > USER_ADDRESS_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.addressMax;
    return formatValidationMessage(message, options);
  }

  if (!ADDRESS_PATTERN.test(address)) {
    const message = VALIDATION_MESSAGES.format.address;
    return formatValidationMessage(message, options);
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
    return formatValidationMessage(message, options);
  }

  if (comment.length > USER_REVIEW_COMMENT_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.reviewCommentMax;
    return formatValidationMessage(message, options);
  }

  if (!REVIEW_COMMENT_PATTERN.test(comment)) {
    const message = VALIDATION_MESSAGES.format.reviewComment;
    return formatValidationMessage(message, options);
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
    return formatValidationMessage(message, options);
  }

  if (!ORDER_COMMENT_PATTERN.test(comment)) {
    const message = VALIDATION_MESSAGES.format.orderComment;
    return formatValidationMessage(message, options);
  }

  return '';
}

//=============================================================================

export function buildPictureFileError(file: File): string {
  if (!PICTURE_ALLOWED_TYPES.includes(file.type as never)) {
    return VALIDATION_MESSAGES.format.pictureFileType;
  }

  if (file.size > PICTURE_FILE_MAX_SIZE_BYTES) {
    return VALIDATION_MESSAGES.limits.pictureFileSize;
  }

  return '';
}

//=============================================================================

export function buildPictureUrlError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const pictureUrl = value.trim();

  if (!pictureUrl) {
    return options.required ? VALIDATION_MESSAGES.required.picture : '';
  }

  if (pictureUrl.length > PICTURE_URL_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.picturePayloadMax;
    return formatValidationMessage(message, options);
  }

  if (!PICTURE_DATA_URL_PATTERN.test(pictureUrl) && !isHttpUrl(pictureUrl)) {
    const message = VALIDATION_MESSAGES.format.picture;
    return formatValidationMessage(message, options);
  }

  return '';
}
