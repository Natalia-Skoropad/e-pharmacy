import { z } from 'zod';
import { mongoIdSchema } from '../shared/index';

import {
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_LIMITS,
} from '../../constants/catalog/product-request-validation';

//===============================================================

export const productRequestDocumentUploadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(PRODUCT_REQUEST_LIMITS.fileNameMax)
      .regex(PRODUCT_REQUEST_ATTACHMENT_RULES.fileNamePattern),

    type: z.enum(PRODUCT_REQUEST_ATTACHMENT_RULES.mimeTypes),

    size: z
      .number()
      .int()
      .min(1)
      .max(PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes),

    dataUrl: z
      .string()
      .max(PRODUCT_REQUEST_ATTACHMENT_RULES.maxDataUrlLength)
      .regex(PRODUCT_REQUEST_ATTACHMENT_RULES.dataUrlPattern),
  })

  .strict();

//===============================================================

export const productRequestDocumentParamsSchema = z.object({
  requestId: mongoIdSchema,
  documentId: mongoIdSchema,
});

//===============================================================

export type ProductRequestDocumentUploadInput = z.infer<
  typeof productRequestDocumentUploadSchema
>;

export type ProductRequestDocumentParams = z.infer<
  typeof productRequestDocumentParamsSchema
>;
