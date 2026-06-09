import { z } from 'zod';

import {
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
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
  USER_SEARCH_MAX_LENGTH,
} from './limits';

import { isHttpUrl } from '../picture';
import { VALIDATION_MESSAGES } from './messages';

import {
  ADDRESS_PATTERN,
  PICTURE_DATA_URL_PATTERN,
  NAME_PATTERN,
  ORDER_COMMENT_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  REVIEW_COMMENT_PATTERN,
  SEARCH_TEXT_PATTERN,
} from './patterns';

//=============================================================================

export const sharedNameSchema = z
  .string()
  .trim()
  .min(USER_NAME_MIN_LENGTH, VALIDATION_MESSAGES.limits.nameMin)
  .max(USER_NAME_MAX_LENGTH, VALIDATION_MESSAGES.limits.nameMax)
  .regex(NAME_PATTERN, VALIDATION_MESSAGES.format.name);

//=============================================================================

export const sharedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(VALIDATION_MESSAGES.format.emailApi)
  .max(USER_EMAIL_MAX_LENGTH, VALIDATION_MESSAGES.limits.emailMax);

//=============================================================================

export const sharedPhoneSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.required.phone)
  .max(USER_PHONE_MAX_LENGTH, VALIDATION_MESSAGES.limits.phoneMax)
  .regex(PHONE_PATTERN, VALIDATION_MESSAGES.format.phone);

//=============================================================================

export const sharedPasswordSchema = z
  .string()
  .min(USER_PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.limits.passwordMin)
  .max(USER_PASSWORD_MAX_LENGTH, VALIDATION_MESSAGES.limits.passwordMax)
  .regex(PASSWORD_PATTERN, VALIDATION_MESSAGES.format.password);

export const sharedRequiredPasswordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.required.password);

//=============================================================================

export const sharedRequiredAddressSchema = z
  .string()
  .trim()
  .min(USER_ADDRESS_MIN_LENGTH, VALIDATION_MESSAGES.limits.addressMin)
  .max(USER_ADDRESS_MAX_LENGTH, VALIDATION_MESSAGES.limits.addressMax)
  .regex(ADDRESS_PATTERN, VALIDATION_MESSAGES.format.address);

export const sharedOptionalAddressSchema = z
  .union([sharedRequiredAddressSchema, z.literal('')])
  .optional()
  .transform((value: string | undefined) => (value === '' ? undefined : value));

export const sharedAddressSchema = sharedOptionalAddressSchema;

//=============================================================================

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

//=============================================================================

export const sharedReviewRatingSchema = z.coerce
  .number()
  .int(VALIDATION_MESSAGES.format.reviewRating)
  .min(MIN_REVIEW_RATING, VALIDATION_MESSAGES.format.reviewRating)
  .max(MAX_REVIEW_RATING, VALIDATION_MESSAGES.format.reviewRating);

//=============================================================================

export const sharedOrderCommentSchema = z
  .string()
  .trim()
  .max(
    USER_ORDER_COMMENT_MAX_LENGTH,
    VALIDATION_MESSAGES.limits.orderCommentMax
  )
  .regex(ORDER_COMMENT_PATTERN, VALIDATION_MESSAGES.format.orderComment)
  .optional();

//=============================================================================

export const sharedSearchSchema = z
  .string()
  .trim()
  .max(USER_SEARCH_MAX_LENGTH, VALIDATION_MESSAGES.limits.searchMax)
  .regex(SEARCH_TEXT_PATTERN, VALIDATION_MESSAGES.format.search)
  .optional();

//=============================================================================

export const sharedPictureUrlSchema = z
  .string()
  .trim()
  .max(PICTURE_URL_MAX_LENGTH, VALIDATION_MESSAGES.limits.picturePayloadMax)
  .refine(
    (value: string) => PICTURE_DATA_URL_PATTERN.test(value) || isHttpUrl(value),
    VALIDATION_MESSAGES.format.picture
  )
  .optional()
  .nullable();
