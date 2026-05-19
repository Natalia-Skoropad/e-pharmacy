import { z } from 'zod';

import { isAvatarDataUrl } from '@e-pharmacy/validation';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  ADDRESS_MAX_LENGTH,
  ADDRESS_MIN_LENGTH,
  AVATAR_URL_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_ROLES,
} from '../constants/auth';

//===============================================================

const nameSchema = z
  .string()
  .trim()
  .min(
    USER_NAME_MIN_LENGTH,
    `Name must be at least ${USER_NAME_MIN_LENGTH} characters`
  )
  .max(
    USER_NAME_MAX_LENGTH,
    `Name must be at most ${USER_NAME_MAX_LENGTH} characters`
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email must be valid')
  .max(
    EMAIL_MAX_LENGTH,
    `Email must be at most ${EMAIL_MAX_LENGTH} characters`
  );

const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password must be at most ${PASSWORD_MAX_LENGTH} characters`
  );

const phoneSchema = z
  .string()
  .trim()
  .max(PHONE_MAX_LENGTH, `Phone must be at most ${PHONE_MAX_LENGTH} characters`)
  .optional();

const addressSchema = z
  .string()
  .trim()
  .min(ADDRESS_MIN_LENGTH)
  .max(ADDRESS_MAX_LENGTH)
  .optional();

const avatarUrlSchema = z
  .string()
  .trim()
  .max(
    AVATAR_URL_MAX_LENGTH,
    `Avatar image must be at most ${AVATAR_URL_MAX_LENGTH} characters`
  )
  .refine((value) => {
    if (isAvatarDataUrl(value)) return true;

    try {
      const parsedUrl = new URL(value);

      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Avatar must be a valid image URL or JPG/PNG/WEBP upload')
  .optional()
  .nullable();

//===============================================================

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,

  /**
   * Public registration is intentionally customer-only. Vendor/admin accounts
   * must be created through a protected approval flow, not by user payload.
   */
  role: z.literal(USER_ROLES.CUSTOMER).default(USER_ROLES.CUSTOMER),

  phone: phoneSchema,
  address: addressSchema,
});

//===============================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

//===============================================================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});


//===============================================================

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema,
    address: z
      .string()
      .trim()
      .min(ADDRESS_MIN_LENGTH)
      .max(ADDRESS_MAX_LENGTH)
      .optional()
      .or(z.literal('')),
    avatarUrl: avatarUrlSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

//===============================================================

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
