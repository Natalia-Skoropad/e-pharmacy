import { z } from 'zod';

import {
  PHARMACY_OWNER_DOCUMENT_RULES,
  PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES,
} from '../constants/pharmacy-owner-document-validation';

import { mongoIdSchema } from './shared';

//===============================================================

export const pharmacyOwnerDocumentUploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.requiredName)

    .max(
      PHARMACY_OWNER_DOCUMENT_RULES.fileNameMaxLength,
      PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.nameLength
    )

    .regex(
      PHARMACY_OWNER_DOCUMENT_RULES.fileNamePattern,
      PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.format
    ),

  size: z
    .number()
    .int()
    .positive()

    .max(
      PHARMACY_OWNER_DOCUMENT_RULES.maxSizeBytes,
      PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.size
    ),

  type: z.enum(PHARMACY_OWNER_DOCUMENT_RULES.mimeTypes),

  dataUrl: z
    .string()
    .min(1, 'Document content is required')

    .max(
      Math.ceil((PHARMACY_OWNER_DOCUMENT_RULES.maxSizeBytes * 4) / 3) + 256,
      PHARMACY_OWNER_DOCUMENT_VALIDATION_MESSAGES.size
    )

    .regex(
      /^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/,
      'Document content must be a base64 data URL'
    ),
});

//===============================================================

export const pharmacyOwnerDocumentParamsSchema = z.object({
  documentId: mongoIdSchema,
});

export const adminPharmacyOwnerDocumentParamsSchema = z.object({
  ownerId: mongoIdSchema,
  documentId: mongoIdSchema,
});

//===============================================================

export type PharmacyOwnerDocumentUploadInput = z.infer<
  typeof pharmacyOwnerDocumentUploadSchema
>;

export type PharmacyOwnerDocumentParams = z.infer<
  typeof pharmacyOwnerDocumentParamsSchema
>;

export type AdminPharmacyOwnerDocumentParams = z.infer<
  typeof adminPharmacyOwnerDocumentParamsSchema
>;
