import { z } from 'zod';

import {
  PHARMACY_DOCUMENT_RULES,
  PHARMACY_DOCUMENT_VALIDATION_MESSAGES,
} from '../../constants/pharmacy-document-validation';

//===============================================================

export const pharmacyDocumentSchema = z.object({
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
    .nonnegative()
    .max(
      PHARMACY_DOCUMENT_RULES.maxSizeBytes,
      PHARMACY_DOCUMENT_VALIDATION_MESSAGES.size
    ),

  type: z.enum(PHARMACY_DOCUMENT_RULES.mimeTypes),
});

//===============================================================

export const pharmacyDocumentsSchema = z
  .array(pharmacyDocumentSchema)
  .max(
    PHARMACY_DOCUMENT_RULES.maxFiles,
    PHARMACY_DOCUMENT_VALIDATION_MESSAGES.count
  );
