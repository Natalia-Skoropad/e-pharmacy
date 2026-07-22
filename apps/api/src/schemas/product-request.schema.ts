import { z } from 'zod';

import { sharedSearchSchema } from './shared-validation.schema';
import { PRODUCT_CATEGORIES } from '../types/categories';

import {
  PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES,
  PRODUCT_REQUEST_ADDITIONAL_FILE_NAME_PATTERN,
  PRODUCT_REQUEST_IMAGE_DATA_URL_PATTERN,
  PRODUCT_REQUEST_IMAGE_FILE_NAME_PATTERN,
  PRODUCT_REQUEST_IMAGE_MIME_TYPES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from '../constants/product-request-validation';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');
const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(20);

//===============================================================

const dateFilterSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .optional();

//===============================================================

const optionalText = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message).optional().or(z.literal(''));

//===============================================================

const productRequestFileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(
      PRODUCT_REQUEST_LIMITS.fileNameMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileName
    )
    .regex(
      PRODUCT_REQUEST_ADDITIONAL_FILE_NAME_PATTERN,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.format.additionalFile
    ),

  type: z.enum(PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES),

  size: z
    .number()
    .int()
    .min(0)
    .max(
      PRODUCT_REQUEST_LIMITS.additionalFileMaxSizeBytes,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.additionalFileSize
    ),

  dataUrl: z.string().max(PRODUCT_REQUEST_LIMITS.dataUrlMaxLength).optional(),
});

//===============================================================

const productImageSchema = productRequestFileSchema.extend({
  name: z
    .string()
    .trim()
    .min(1)
    .max(
      PRODUCT_REQUEST_LIMITS.fileNameMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileName
    )
    .regex(
      PRODUCT_REQUEST_IMAGE_FILE_NAME_PATTERN,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage
    ),

  type: z.enum(PRODUCT_REQUEST_IMAGE_MIME_TYPES),

  size: z
    .number()
    .int()
    .min(0)
    .max(
      PRODUCT_REQUEST_LIMITS.productImageMaxSizeBytes,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageSize
    ),

  dataUrl: z
    .string()
    .max(PRODUCT_REQUEST_LIMITS.dataUrlMaxLength)
    .regex(
      PRODUCT_REQUEST_IMAGE_DATA_URL_PATTERN,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage
    )
    .optional(),
});

//===============================================================

function normalizePaginationQuery(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  const query = { ...(value as Record<string, unknown>) };

  if (query.perPage === undefined && query.limit !== undefined) {
    query.perPage = query.limit;
  }

  return query;
}

//===============================================================

export const productRequestsQuerySchema = z.preprocess(
  normalizePaginationQuery,
  z.object({
    page: positivePageSchema,
    perPage: perPageSchema,
    dateFrom: dateFilterSchema,
    dateTo: dateFilterSchema,
    requestNumber: sharedSearchSchema,
    productName: sharedSearchSchema,
    productArticle: sharedSearchSchema,
    name: sharedSearchSchema,
    article: sharedSearchSchema,
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    status: z.enum(PRODUCT_REQUEST_STATUSES).optional(),
  })
);

//===============================================================

export const productRequestFormSchema = z
  .object({
    status: z.enum(['draft', 'new']).default('draft'),

    name: z
      .string()
      .trim()
      .min(1, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.name)
      .max(
        PRODUCT_REQUEST_LIMITS.nameMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.name
      ),

    article: z
      .string()
      .trim()
      .min(1, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.article)
      .max(
        PRODUCT_REQUEST_LIMITS.articleMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article
      ),

    category: z.enum(PRODUCT_CATEGORIES),

    customCategory: optionalText(
      PRODUCT_REQUEST_LIMITS.customCategoryMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.customCategory
    ),
    productImage: productImageSchema.optional(),
    manufacturer: optionalText(
      PRODUCT_REQUEST_LIMITS.manufacturerMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.manufacturer
    ),

    countryOfOrigin: optionalText(
      PRODUCT_REQUEST_LIMITS.countryOfOriginMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.countryOfOrigin
    ),

    dosage: optionalText(
      PRODUCT_REQUEST_LIMITS.dosageMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.dosage
    ),

    packageSize: optionalText(
      PRODUCT_REQUEST_LIMITS.packageSizeMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.packageSize
    ),

    form: optionalText(
      PRODUCT_REQUEST_LIMITS.formMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.form
    ),

    activeSubstance: optionalText(
      PRODUCT_REQUEST_LIMITS.activeSubstanceMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeSubstance
    ),

    prescriptionType: optionalText(
      PRODUCT_REQUEST_LIMITS.prescriptionTypeMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.prescriptionType
    ),

    fullDescription: optionalText(
      PRODUCT_REQUEST_LIMITS.fullDescriptionMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescription
    ),

    pharmacyComment: optionalText(
      PRODUCT_REQUEST_LIMITS.pharmacyCommentMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.pharmacyComment
    ),

    additionalFiles: z
      .array(productRequestFileSchema)
      .max(
        PRODUCT_REQUEST_LIMITS.additionalFilesMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.additionalFilesCount
      )
      .optional(),
  })

  .superRefine((value, context) => {
    if (value.category === 'other' && !value.customCategory?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['customCategory'],
        message: PRODUCT_REQUEST_VALIDATION_MESSAGES.required.customCategory,
      });
    }

    if (value.status !== 'new') return;

    const requiredForModeration = [
      [
        'productImage',
        value.productImage,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.productImage,
      ],
      [
        'manufacturer',
        value.manufacturer,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.manufacturer,
      ],
      [
        'countryOfOrigin',
        value.countryOfOrigin,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.countryOfOrigin,
      ],
      [
        'dosage',
        value.dosage,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.dosage,
      ],
      [
        'packageSize',
        value.packageSize,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.packageSize,
      ],
      ['form', value.form, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.form],
      [
        'activeSubstance',
        value.activeSubstance,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.activeSubstance,
      ],
      [
        'prescriptionType',
        value.prescriptionType,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.prescriptionType,
      ],
      [
        'fullDescription',
        value.fullDescription,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.fullDescription,
      ],
    ] as const;

    for (const [field, fieldValue, message] of requiredForModeration) {
      const isFilled =
        typeof fieldValue === 'string'
          ? Boolean(fieldValue.trim())
          : Boolean(fieldValue);

      if (isFilled) continue;

      context.addIssue({
        code: 'custom',
        path: [field],
        message,
      });
    }
  });

//===============================================================

export const productRequestArticleAvailabilityQuerySchema = z.object({
  article: z
    .string()
    .trim()
    .min(1, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.article)
    .max(
      PRODUCT_REQUEST_LIMITS.articleMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article
    ),
  excludeRequestId: mongoIdSchema.optional(),
});

//===============================================================

export const productRequestParamsSchema = z.object({
  requestId: mongoIdSchema,
});

//===============================================================

export type ProductRequestsQuery = z.infer<typeof productRequestsQuerySchema>;

export type ProductRequestArticleAvailabilityQuery = z.infer<
  typeof productRequestArticleAvailabilityQuerySchema
>;

export type ProductRequestFormInput = z.infer<typeof productRequestFormSchema>;
