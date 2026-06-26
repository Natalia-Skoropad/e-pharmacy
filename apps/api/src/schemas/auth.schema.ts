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

import { AUTH_APPLICATIONS, USER_ROLES } from '../constants/auth';

//===============================================================

const currentPasswordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.required.currentPassword);

const optionalPhoneSchema = sharedRequiredPhoneSchema.optional();

//===============================================================

export const registerSchema = z.object({
  name: sharedNameSchema,
  email: sharedEmailSchema,
  password: sharedPasswordSchema,

  /**
   * Public registration supports client accounts now and pharmacy accounts for
   * the shared auth flow. Admin accounts must still be created separately.
   */
  role: z
    .enum([USER_ROLES.CLIENT, USER_ROLES.PHARMACY])
    .default(USER_ROLES.CLIENT),

  phone: sharedRequiredPhoneSchema,
  address: sharedOptionalAddressSchema,
  pharmacyDocuments: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        size: z.number().nonnegative(),
        type: z.string().trim().optional().default(''),
      })
    )
    .max(6)
    .optional(),
}).superRefine((data, ctx) => {
  if (data.role !== USER_ROLES.PHARMACY) return;

  if (!data.pharmacyDocuments || data.pharmacyDocuments.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['pharmacyDocuments'],
      message: 'Pharmacy documents are required',
    });
  }
});

//===============================================================

export const createPharmacyUserSchema = z.object({
  name: sharedNameSchema,
  email: sharedEmailSchema,
  password: sharedPasswordSchema,
  phone: sharedRequiredPhoneSchema,
  address: sharedOptionalAddressSchema,
  pharmacyName: sharedNameSchema.optional(),
  pharmacyDocuments: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        size: z.number().nonnegative(),
        type: z.string().trim().optional().default(''),
      })
    )
    .max(6)
    .optional(),
}).superRefine((data, ctx) => {
  if (!data.pharmacyDocuments || data.pharmacyDocuments.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['pharmacyDocuments'],
      message: 'Pharmacy documents are required',
    });
  }
});

//===============================================================

export const loginSchema = z.object({
  email: sharedEmailSchema,
  password: sharedRequiredPasswordSchema,
  application: z
    .enum([AUTH_APPLICATIONS.CLIENT, AUTH_APPLICATIONS.PHARMACY])
    .optional(),
});

//===============================================================

export const forgotPasswordSchema = z.object({
  email: sharedEmailSchema,
  application: z.enum([
    AUTH_APPLICATIONS.CLIENT,
    AUTH_APPLICATIONS.PHARMACY,
    AUTH_APPLICATIONS.ADMIN,
  ]),
});

//===============================================================

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, VALIDATION_MESSAGES.required.resetToken),
  newPassword: sharedPasswordSchema,
});

//===============================================================

export const updateProfileSchema = z
  .object({
    name: sharedNameSchema.optional(),
    phone: optionalPhoneSchema,
    address: sharedOptionalAddressSchema,
    pictureUrl: sharedPictureUrlSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION_MESSAGES.object.atLeastOneField,
  });

//===============================================================

export const updatePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: sharedPasswordSchema,
});
