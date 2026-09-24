import { z } from 'zod';

import {
  ADMIN_EMPLOYEE_DOCUMENT_RULES,
  ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES,
} from '../constants/admin-employee-document-validation';

import { mongoIdSchema } from './shared';

//===============================================================

export const adminEmployeeDocumentUploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.requiredName)

    .max(
      ADMIN_EMPLOYEE_DOCUMENT_RULES.fileNameMaxLength,
      ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.nameLength
    )

    .regex(
      ADMIN_EMPLOYEE_DOCUMENT_RULES.fileNamePattern,
      ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.format
    ),

  size: z
    .number()
    .int()
    .positive()

    .max(
      ADMIN_EMPLOYEE_DOCUMENT_RULES.maxSizeBytes,
      ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.size
    ),

  type: z.enum(ADMIN_EMPLOYEE_DOCUMENT_RULES.mimeTypes),

  dataUrl: z
    .string()
    .min(1, 'Document content is required')

    .max(
      Math.ceil((ADMIN_EMPLOYEE_DOCUMENT_RULES.maxSizeBytes * 4) / 3) + 256,
      ADMIN_EMPLOYEE_DOCUMENT_VALIDATION_MESSAGES.size
    )

    .regex(
      /^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/,
      'Document content must be a base64 data URL'
    ),
});

//===============================================================

export const adminEmployeeDocumentParamsSchema = z.object({
  documentId: mongoIdSchema,
});

//===============================================================

export type AdminEmployeeDocumentUploadInput = z.infer<
  typeof adminEmployeeDocumentUploadSchema
>;

export type AdminEmployeeDocumentParams = z.infer<
  typeof adminEmployeeDocumentParamsSchema
>;
