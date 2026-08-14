import { z } from 'zod';

import {
  PHARMACY_DOCUMENT_RULES,
  PHARMACY_DOCUMENT_VALIDATION_MESSAGES,
} from '../../constants/pharmacy-document-validation';

import { mongoIdSchema } from './id.schema';

//===============================================================

const documentMetadataShape = {
  name: z
    .string()
    .trim()
    .min(1, PHARMACY_DOCUMENT_VALIDATION_MESSAGES.requiredName)
    .max(
      PHARMACY_DOCUMENT_RULES.fileNameMaxLength,
      PHARMACY_DOCUMENT_VALIDATION_MESSAGES.nameLength
    )
    .regex(
      PHARMACY_DOCUMENT_RULES.fileNamePattern,
      PHARMACY_DOCUMENT_VALIDATION_MESSAGES.format
    ),

  size: z
    .number()
    .int()
    .positive()
    .max(
      PHARMACY_DOCUMENT_RULES.maxSizeBytes,
      PHARMACY_DOCUMENT_VALIDATION_MESSAGES.size
    ),

  type: z.enum(PHARMACY_DOCUMENT_RULES.mimeTypes),
};

//===============================================================

export const pharmacyDocumentUploadSchema = z.object({
  ...documentMetadataShape,
  dataUrl: z
    .string()
    .min(1, 'Document content is required')
    .max(
      Math.ceil((PHARMACY_DOCUMENT_RULES.maxSizeBytes * 4) / 3) + 256,
      PHARMACY_DOCUMENT_VALIDATION_MESSAGES.size
    )
    .regex(
      /^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/,
      'Document content must be a base64 data URL'
    ),
});

//===============================================================

export const pharmacyRegistrationDocumentUploadSchema =
  pharmacyDocumentUploadSchema.extend({
    uploadSessionId: mongoIdSchema,
    uploadToken: z
      .string()
      .trim()
      .regex(/^[a-f\d]{64}$/i),
  });

//===============================================================

export const pharmacyRegistrationDocumentClaimSchema = z.object({
  documentId: mongoIdSchema,
  claimToken: z
    .string()
    .trim()
    .regex(/^[a-f\d]{64}$/i),
});

//===============================================================

export const pharmacyRegistrationDocumentClaimsSchema = z
  .array(pharmacyRegistrationDocumentClaimSchema)
  .max(
    PHARMACY_DOCUMENT_RULES.maxFiles,
    PHARMACY_DOCUMENT_VALIDATION_MESSAGES.count
  );

//===============================================================

export const pharmacyProfileDocumentSelectionSchema = z.object({
  documentId: mongoIdSchema,
});

//===============================================================

export const pharmacyProfileDocumentSelectionsSchema = z
  .array(pharmacyProfileDocumentSelectionSchema)
  .max(
    PHARMACY_DOCUMENT_RULES.maxFiles,
    PHARMACY_DOCUMENT_VALIDATION_MESSAGES.count
  );

//===============================================================

export type PharmacyDocumentUploadInput = z.infer<
  typeof pharmacyDocumentUploadSchema
>;

export type PharmacyRegistrationDocumentUploadInput = z.infer<
  typeof pharmacyRegistrationDocumentUploadSchema
>;

export type PharmacyRegistrationDocumentClaimInput = z.infer<
  typeof pharmacyRegistrationDocumentClaimSchema
>;

export type PharmacyProfileDocumentSelectionInput = z.infer<
  typeof pharmacyProfileDocumentSelectionSchema
>;
