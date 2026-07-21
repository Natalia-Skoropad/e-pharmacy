import { z } from 'zod';

import { sharedSearchSchema } from './shared-validation.schema';
import { PRODUCT_CATEGORIES } from '../types/categories';

//===============================================================

export const PRODUCT_REQUEST_STATUS_OPTIONS = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const;

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');
const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(20);

const dateFilterSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .optional();

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().or(z.literal(''));

const productRequestFileSchema = z.object({
  name: z.string().trim().min(1).max(180),
  type: z.string().trim().max(120).default('application/octet-stream'),
  size: z
    .number()
    .int()
    .min(0)
    .max(10 * 1024 * 1024),
  dataUrl: z.string().max(3 * 1024 * 1024).optional(),
});

const productImageSchema = productRequestFileSchema.extend({
  size: z
    .number()
    .int()
    .min(0)
    .max(2 * 1024 * 1024),
  dataUrl: z
    .string()
    .max(3 * 1024 * 1024)
    .regex(
      /^data:image\/(jpeg|png|webp);base64,/i,
      'Product image must be a valid image data URL'
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
    status: z.enum(PRODUCT_REQUEST_STATUS_OPTIONS).optional(),
  })
);

//===============================================================

const productRequestFormSchema = z
  .object({
    status: z.enum(['draft', 'new']).default('draft'),
    name: z.string().trim().min(1, 'Product name is required').max(160),
    article: z.string().trim().min(1, 'Product article is required').max(40),
    category: z.enum(PRODUCT_CATEGORIES),
    customCategory: optionalText(100),
    productImage: productImageSchema.optional(),
    manufacturer: optionalText(160),
    countryOfOrigin: optionalText(100),
    dosage: optionalText(100),
    packageSize: optionalText(100),
    form: optionalText(100),
    activeSubstance: optionalText(180),
    prescriptionType: optionalText(80),
    fullDescription: optionalText(5000),
    pharmacyComment: optionalText(1500),
    additionalFiles: z.array(productRequestFileSchema).max(5).optional(),
  })
  .superRefine((value, context) => {
    if (value.category === 'other' && !value.customCategory?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['customCategory'],
        message: 'Enter the custom category name',
      });
    }

    if (value.status !== 'new') return;

    const requiredForModeration = [
      ['productImage', value.productImage],
      ['manufacturer', value.manufacturer],
      ['countryOfOrigin', value.countryOfOrigin],
      ['dosage', value.dosage],
      ['packageSize', value.packageSize],
      ['form', value.form],
      ['activeSubstance', value.activeSubstance],
      ['prescriptionType', value.prescriptionType],
      ['fullDescription', value.fullDescription],
    ] as const;

    for (const [field, fieldValue] of requiredForModeration) {
      const isFilled =
        typeof fieldValue === 'string'
          ? Boolean(fieldValue.trim())
          : Boolean(fieldValue);

      if (isFilled) continue;

      context.addIssue({
        code: 'custom',
        path: [field],
        message: 'This field is required for moderation',
      });
    }
  });

export const createProductRequestSchema = productRequestFormSchema;
export const updateProductRequestSchema = productRequestFormSchema;

//===============================================================

export const productRequestArticleAvailabilityQuerySchema = z.object({
  article: z.string().trim().min(1).max(40),
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

export type CreateProductRequestInput = z.infer<
  typeof createProductRequestSchema
>;

export type UpdateProductRequestInput = z.infer<
  typeof updateProductRequestSchema
>;
