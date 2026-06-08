import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation';

import {
  sharedEmailSchema,
  sharedNameSchema,
  sharedOptionalAddressSchema,
  sharedPasswordSchema,
  sharedPictureUrlSchema,
  sharedRequiredPhoneSchema,
} from './shared-validation.schema';

import {
  USER_ROLES,
  VENDOR_ACCOUNT_STATUSES,
} from '../constants/auth';

//===============================================================

const nameSchema = sharedNameSchema;
const emailSchema = sharedEmailSchema;
const passwordSchema = sharedPasswordSchema;
const requiredPhoneSchema = sharedRequiredPhoneSchema;
const optionalPhoneSchema = sharedRequiredPhoneSchema.optional();
const optionalAddressSchema = sharedOptionalAddressSchema;
const pictureUrlSchema = sharedPictureUrlSchema;

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

  phone: requiredPhoneSchema,
  address: optionalAddressSchema,
});

//===============================================================

export const createVendorUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: requiredPhoneSchema,
  address: optionalAddressSchema,
  vendorStatus: z
    .enum(Object.values(VENDOR_ACCOUNT_STATUSES))
    .default(VENDOR_ACCOUNT_STATUSES.PENDING),
});

export const updateVendorStatusSchema = z.object({
  vendorStatus: z.enum(Object.values(VENDOR_ACCOUNT_STATUSES)),
});

//===============================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, VALIDATION_MESSAGES.required.password),
});

//===============================================================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, VALIDATION_MESSAGES.required.resetToken),
  newPassword: passwordSchema,
});

//===============================================================

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: optionalPhoneSchema,
    address: optionalAddressSchema,
    pictureUrl: pictureUrlSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.object.atLeastOneField,
  });

//===============================================================

export const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, VALIDATION_MESSAGES.required.currentPassword),
  newPassword: passwordSchema,
});
