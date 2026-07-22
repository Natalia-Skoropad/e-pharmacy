import { z } from 'zod';

import { sharedSearchSchema } from './shared-validation.schema';

import {
  DATE_RANGE_MESSAGE,
  isDateRangeOrdered,
  optionalCalendarDateSchema,
} from './shared/date.schema';

import { optionalTrimmedTextSchema } from './shared/optional-text.schema';
import { PRODUCT_CATEGORIES } from '../types/categories';

import {
  PRODUCT_REQUEST_ARTICLE_PATTERN,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_LONG_TEXT_PATTERN,
  PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from '../constants/product-request-validation';

//===============================================================

const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID must be valid');
const positivePageSchema = z.coerce.number().int().min(1).default(1);
const perPageSchema = z.coerce.number().int().min(1).max(200).default(20);

//===============================================================

function getDataUrlByteSize(dataUrl: string): number | null {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return null;

  const base64 = dataUrl.slice(commaIndex + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;

  return Math.floor((base64.length * 3) / 4) - padding;
}

//===============================================================

type ProductRequestFileRules = Readonly<{
  maxSizeBytes: number;
  requireDataUrl?: boolean;
  maxDataUrlLength: number;
  mimeTypes: readonly [string, ...string[]];
  fileNamePattern: RegExp;
  dataUrlPattern: RegExp;
}>;

//===============================================================

function createProductRequestFileSchema(
  rules: ProductRequestFileRules,
  formatMessage: string,
  sizeMessage: string,
  dataMessage: string
) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'File name is required.')
        .max(
          PRODUCT_REQUEST_LIMITS.fileNameMax,
          PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileName
        )
        .regex(rules.fileNamePattern, formatMessage),
      type: z.enum(rules.mimeTypes),
      size: z.number().int().min(0).max(rules.maxSizeBytes, sizeMessage),
      dataUrl: z
        .string()
        .max(rules.maxDataUrlLength, dataMessage)
        .regex(rules.dataUrlPattern, formatMessage)
        .optional(),
    })

    .superRefine((file, context) => {
      if (!file.dataUrl) {
        if (rules.requireDataUrl) {
          context.addIssue({
            code: 'custom',
            path: ['dataUrl'],
            message:
              PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentDataRequired,
          });
        }

        return;
      }

      const dataUrlMimeType = file.dataUrl.match(
        /^data:([^;,]+);base64,/i
      )?.[1];
      if (dataUrlMimeType?.toLowerCase() !== file.type.toLowerCase()) {
        context.addIssue({
          code: 'custom',
          path: ['dataUrl'],
          message: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.attachmentData,
        });
      }

      const dataUrlSize = getDataUrlByteSize(file.dataUrl);
      if (dataUrlSize === null || dataUrlSize !== file.size) {
        context.addIssue({
          code: 'custom',
          path: ['size'],
          message: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.fileSizeMismatch,
        });
      } else if (dataUrlSize > rules.maxSizeBytes) {
        context.addIssue({
          code: 'custom',
          path: ['dataUrl'],
          message: sizeMessage,
        });
      }
    });
}

//===============================================================

const productRequestFileSchema = createProductRequestFileSchema(
  { ...PRODUCT_REQUEST_ATTACHMENT_RULES, requireDataUrl: true },
  PRODUCT_REQUEST_VALIDATION_MESSAGES.format.attachment,
  PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentSize,
  PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentData
);

//===============================================================

const productImageSchema = createProductRequestFileSchema(
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_VALIDATION_MESSAGES.format.productImage,
  PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageSize,
  PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.productImageData
);

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
  z
    .object({
      page: positivePageSchema,
      perPage: perPageSchema,
      dateFrom: optionalCalendarDateSchema,
      dateTo: optionalCalendarDateSchema,
      requestNumber: sharedSearchSchema,
      productName: sharedSearchSchema,
      productArticle: sharedSearchSchema,
      name: sharedSearchSchema,
      article: sharedSearchSchema,
      category: z.enum(PRODUCT_CATEGORIES).optional(),
      status: z.enum(PRODUCT_REQUEST_STATUSES).optional(),
    })
    .refine((query) => isDateRangeOrdered(query.dateFrom, query.dateTo), {
      path: ['dateTo'],
      message: DATE_RANGE_MESSAGE,
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
      )
      .regex(
        PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText
      ),

    article: z
      .string()
      .trim()
      .min(1, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.article)
      .max(
        PRODUCT_REQUEST_LIMITS.articleMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article
      )
      .regex(
        PRODUCT_REQUEST_ARTICLE_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article
      ),

    category: z.enum(PRODUCT_CATEGORIES),

    customCategory: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.customCategoryMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.customCategory,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    productImage: productImageSchema.optional(),
    manufacturer: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.manufacturerMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.manufacturer,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    countryOfOrigin: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.countryOfOriginMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.countryOfOrigin,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    dosage: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.dosageMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.dosage,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    packageSize: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.packageSizeMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.packageSize,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    form: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.formMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.form,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    activeSubstance: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.activeSubstanceMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeSubstance,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }),

    prescriptionType: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.prescriptionTypeMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.prescriptionType,
    }),

    fullDescription: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.fullDescriptionMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescription,
      pattern: PRODUCT_REQUEST_LONG_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.longText,
    }),

    pharmacyComment: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.pharmacyCommentMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.pharmacyComment,
      pattern: PRODUCT_REQUEST_LONG_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.longText,
    }),

    additionalFiles: z
      .array(productRequestFileSchema)
      .max(
        PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentsCount
      )
      .refine(
        (files) =>
          files.reduce((total, file) => total + file.size, 0) <=
          PRODUCT_REQUEST_ATTACHMENT_RULES.maxTotalSizeBytes,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentsTotalSize
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
