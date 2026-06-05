import { z } from 'zod';

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
  USER_SEARCH_MAX_LENGTH,
} from './limits';

import { VALIDATION_MESSAGES } from './messages';

import {
  ORDER_COMMENT_PATTERN,
  PASSWORD_PATTERN,
  REVIEW_COMMENT_PATTERN,
  SEARCH_TEXT_PATTERN,
} from './patterns';

//=============================================================================

export const sharedNameSchema = z
  .string()
  .trim()
  .min(USER_NAME_MIN_LENGTH, VALIDATION_MESSAGES.limits.nameMin)
  .max(USER_NAME_MAX_LENGTH, VALIDATION_MESSAGES.limits.nameMax);

export const sharedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(VALIDATION_MESSAGES.format.emailApi)
  .max(USER_EMAIL_MAX_LENGTH, VALIDATION_MESSAGES.limits.emailMax);

export const sharedPhoneSchema = z
  .string()
  .trim()
  .max(USER_PHONE_MAX_LENGTH, VALIDATION_MESSAGES.limits.phoneMax)
  .optional();

export const sharedPasswordSchema = z
  .string()
  .min(USER_PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.limits.passwordMin)
  .max(USER_PASSWORD_MAX_LENGTH, VALIDATION_MESSAGES.limits.passwordMax)
  .regex(PASSWORD_PATTERN, VALIDATION_MESSAGES.format.password);

export const sharedAddressSchema = z
  .string()
  .trim()
  .min(USER_ADDRESS_MIN_LENGTH, VALIDATION_MESSAGES.limits.addressMin)
  .max(USER_ADDRESS_MAX_LENGTH, VALIDATION_MESSAGES.limits.addressMax)
  .optional();

export const sharedReviewCommentSchema = z
  .string()
  .trim()
  .min(
    USER_REVIEW_COMMENT_MIN_LENGTH,
    VALIDATION_MESSAGES.limits.reviewCommentMin
  )
  .max(
    USER_REVIEW_COMMENT_MAX_LENGTH,
    VALIDATION_MESSAGES.limits.reviewCommentMax
  )
  .regex(REVIEW_COMMENT_PATTERN, VALIDATION_MESSAGES.format.reviewComment);

export const sharedOrderCommentSchema = z
  .string()
  .trim()
  .max(
    USER_ORDER_COMMENT_MAX_LENGTH,
    VALIDATION_MESSAGES.limits.orderCommentMax
  )
  .regex(ORDER_COMMENT_PATTERN, VALIDATION_MESSAGES.format.orderComment)
  .optional();

export const sharedAvatarUrlSchema = z
  .string()
  .trim()
  .max(USER_AVATAR_URL_MAX_LENGTH, VALIDATION_MESSAGES.limits.avatarMax)
  .refine(
    (value: string) => isAvatarDataUrl(value) || isHttpUrl(value),
    VALIDATION_MESSAGES.format.avatar
  )
  .optional()
  .nullable();

export const sharedSearchSchema = z
  .string()
  .trim()
  .max(USER_SEARCH_MAX_LENGTH, VALIDATION_MESSAGES.limits.searchMax)
  .regex(SEARCH_TEXT_PATTERN, VALIDATION_MESSAGES.format.search)
  .optional();
