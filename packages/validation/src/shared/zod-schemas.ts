import { z } from 'zod';

import { isAvatarDataUrl, isHttpUrl } from './assets';
import { VALIDATION_LIMITS } from './limits';
import { VALIDATION_MESSAGES } from './messages';

//=============================================================================

export const sharedNameSchema = z
  .string()
  .trim()
  .min(VALIDATION_LIMITS.nameMin, VALIDATION_MESSAGES.limits.nameMin)
  .max(VALIDATION_LIMITS.nameMax, VALIDATION_MESSAGES.limits.nameMax);

export const sharedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(VALIDATION_MESSAGES.format.emailApi)
  .max(VALIDATION_LIMITS.emailMax, VALIDATION_MESSAGES.limits.emailMax);

export const sharedPasswordSchema = z
  .string()
  .min(VALIDATION_LIMITS.passwordMin, VALIDATION_MESSAGES.limits.passwordMin)
  .max(VALIDATION_LIMITS.passwordMax, VALIDATION_MESSAGES.limits.passwordMax);

export const sharedPhoneSchema = z
  .string()
  .trim()
  .max(VALIDATION_LIMITS.phoneMax, VALIDATION_MESSAGES.limits.phoneMax)
  .optional();

export const sharedAddressSchema = z
  .string()
  .trim()
  .min(VALIDATION_LIMITS.addressMin)
  .max(VALIDATION_LIMITS.addressMax)
  .optional();

export const sharedAvatarUrlSchema = z
  .string()
  .trim()
  .max(VALIDATION_LIMITS.avatarUrlMax, VALIDATION_MESSAGES.limits.avatarMax)
  .refine(
    (value) => isAvatarDataUrl(value) || isHttpUrl(value),
    VALIDATION_MESSAGES.format.avatar
  )
  .optional()
  .nullable();

export const sharedSearchSchema = z
  .string()
  .trim()
  .max(VALIDATION_LIMITS.searchMax)
  .optional();
