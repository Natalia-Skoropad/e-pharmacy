import { z } from 'zod';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
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

const addressSchema = z.string().trim().min(10).max(200).optional();

//===============================================================

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,

  /**
   * For now we allow only customer/vendor self-registration.
   * Admin users should be created manually or through a protected admin flow later.
   */
  role: z
    .enum([USER_ROLES.CUSTOMER, USER_ROLES.VENDOR])
    .default(USER_ROLES.CUSTOMER),

  phone: phoneSchema,
  address: addressSchema,
});

//===============================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
