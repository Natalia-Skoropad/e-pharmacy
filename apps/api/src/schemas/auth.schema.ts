import { z } from 'zod';

import { VALIDATION_MESSAGES } from '../constants/validation';

import {
  sharedEmailSchema,
  sharedUserNameSchema,
  sharedPharmacyNameSchema,
  sharedOptionalAddressSchema,
  sharedPasswordSchema,
  sharedRequiredPasswordSchema,
  sharedPictureUrlSchema,
  sharedRequiredPhoneSchema,
} from './shared-validation.schema';

import { AUTH_APPLICATIONS, USER_ROLES } from '../constants/auth';

import {
  pharmacyRegistrationDocumentUploadSchema,
  pharmacyRegistrationDocumentClaimsSchema,
} from './shared/pharmacy-document.schema';

import { hasMeaningfulValue } from './shared/meaningful-value';

//===============================================================

const currentPasswordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.required.currentPassword);

const optionalPhoneSchema = sharedRequiredPhoneSchema.optional();

//===============================================================

export const registerSchema = z
  .object({
    name: sharedUserNameSchema,
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
    pharmacyDocuments: pharmacyRegistrationDocumentClaimsSchema.optional(),
  })

  .superRefine((data, ctx) => {
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

export const createPharmacyUserSchema = z
  .object({
    name: sharedUserNameSchema,
    email: sharedEmailSchema,
    password: sharedPasswordSchema,
    phone: sharedRequiredPhoneSchema,
    address: sharedOptionalAddressSchema,
    pharmacyName: sharedPharmacyNameSchema.optional(),
    pharmacyDocuments: pharmacyRegistrationDocumentClaimsSchema.optional(),
  })

  .superRefine((data, ctx) => {
    if (!data.pharmacyDocuments || data.pharmacyDocuments.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['pharmacyDocuments'],
        message: 'Pharmacy documents are required',
      });
    }
  });

//===============================================================

export const uploadRegistrationPharmacyDocumentSchema =
  pharmacyRegistrationDocumentUploadSchema;

//===============================================================

export const loginSchema = z.object({
  email: sharedEmailSchema,
  password: sharedRequiredPasswordSchema,

  application: z.enum([AUTH_APPLICATIONS.CLIENT, AUTH_APPLICATIONS.PHARMACY]),
});

//===============================================================

export const forgotPasswordSchema = z.object({
  email: sharedEmailSchema,
  application: z.enum([AUTH_APPLICATIONS.CLIENT, AUTH_APPLICATIONS.PHARMACY]),
});

//===============================================================

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, VALIDATION_MESSAGES.required.resetToken),
  newPassword: sharedPasswordSchema,
});

//===============================================================

export const updateProfileSchema = z
  .object({
    name: sharedUserNameSchema.optional(),
    phone: optionalPhoneSchema,
    address: sharedOptionalAddressSchema,
    pictureUrl: sharedPictureUrlSchema,
  })

  .refine((data) => Object.values(data).some(hasMeaningfulValue), {
    message: VALIDATION_MESSAGES.object.atLeastOneField,
  });

//===============================================================

export const updatePasswordSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: sharedPasswordSchema,
});

//===============================================================

export type CreatePharmacyUserInput = z.infer<typeof createPharmacyUserSchema>;
