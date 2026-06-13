import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation';

import {
  sharedEmailSchema,
  sharedNameSchema,
  sharedOptionalAddressSchema,
  sharedPasswordSchema,
  sharedRequiredPasswordSchema,
  sharedPictureUrlSchema,
  sharedRequiredPhoneSchema,
} from './shared-validation.schema';

import { USER_ROLES, PHARMACY_ACCOUNT_STATUSES } from '../constants/auth';

//===============================================================

const nameSchema = sharedNameSchema;
const emailSchema = sharedEmailSchema;
const passwordSchema = sharedPasswordSchema;
const requiredPasswordSchema = sharedRequiredPasswordSchema;

const currentPasswordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.required.currentPassword);

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
   * Public registration supports client accounts now and pharmacy accounts for
   * the shared auth flow. Admin accounts must still be created separately.
   */
  role: z
    .enum([USER_ROLES.CLIENT, USER_ROLES.PHARMACY])
    .default(USER_ROLES.CLIENT),

  phone: requiredPhoneSchema,
  address: optionalAddressSchema,
});

//===============================================================

export const createPharmacyUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: requiredPhoneSchema,
  address: optionalAddressSchema,
  pharmacyStatus: z
    .enum(Object.values(PHARMACY_ACCOUNT_STATUSES))
    .default(PHARMACY_ACCOUNT_STATUSES.NEW),
});

export const updatePharmacyStatusSchema = z.object({
  pharmacyStatus: z.enum(Object.values(PHARMACY_ACCOUNT_STATUSES)),
});

//===============================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: requiredPasswordSchema,
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
  currentPassword: currentPasswordSchema,
  newPassword: passwordSchema,
});
