import { z } from 'zod';

import {
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  positivePageSchema,
} from '../shared/index';

import { sharedSearchSchema } from '../shared/shared-validation.schema';

import {
  DATE_RANGE_MESSAGE,
  isDateRangeOrdered,
  dateQuerySchema,
} from '../shared/date.schema';

import { optionalTrimmedTextSchema } from '../shared/optional-text.schema';
import { productCategorySlugSchema } from './product-category.schema';
import { PRODUCT_REQUEST_CATEGORY_MODES } from '../../constants/catalog/product-request';

import {
  PRODUCT_REQUEST_ARTICLE_PATTERN,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_LONG_TEXT_PATTERN,
  PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from '../../constants/catalog/product-request-validation';

//===============================================================

function uppercaseInitial(value?: string): string | undefined {
  return value ? value[0].toUpperCase() + value.slice(1) : undefined;
}

//===============================================================

const productRequestsPerPageSchema = createPerPageSchema({
  defaultValue: 20,
  max: 200,
});

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

      size: z
        .number()
        .int()
        .min(1, PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fileSize)
        .max(rules.maxSizeBytes, sizeMessage),

      documentId: mongoIdSchema.optional(),

      dataUrl: z
        .string()
        .max(rules.maxDataUrlLength, dataMessage)
        .regex(rules.dataUrlPattern, formatMessage)
        .optional(),
    })

    .superRefine((file, context) => {
      if (file.documentId && file.dataUrl) {
        context.addIssue({
          code: 'custom',
          path: ['dataUrl'],
          message: 'Choose either a stored document or a new upload.',
        });

        return;
      }

      if (file.documentId && !rules.requireDataUrl) {
        context.addIssue({
          code: 'custom',
          path: ['documentId'],
          message: 'Images cannot reference an attachment ID.',
        });

        return;
      }

      if (!file.dataUrl) {
        if (rules.requireDataUrl && !file.documentId) {
          context.addIssue({
            code: 'custom',
            path: ['dataUrl'],

            message:
              PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.attachmentDataRequired,
          });
        }

        return;
      }

      if (
        /^\/api\/media\/[a-f0-9]{24}\/large$/.test(file.dataUrl) &&
        rules.dataUrlPattern === PRODUCT_REQUEST_IMAGE_RULES.dataUrlPattern
      )
        return;

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

const productRequestsQueryShape = {
  page: positivePageSchema,
  perPage: productRequestsPerPageSchema,
  dateFrom: dateQuerySchema,
  dateTo: dateQuerySchema,
  requestId: mongoIdSchema.optional(),
  productId: mongoIdSchema.optional(),
  linkedOnly: z.literal('true').optional(),
  keyword: sharedSearchSchema,
  requestNumber: sharedSearchSchema,
  productName: sharedSearchSchema,
  productArticle: sharedSearchSchema,
  name: sharedSearchSchema,
  article: sharedSearchSchema,
  category: productCategorySlugSchema.optional(),
  categoryMode: z.enum(PRODUCT_REQUEST_CATEGORY_MODES).optional(),
  status: z.enum(PRODUCT_REQUEST_STATUSES).optional(),
};

//===============================================================

const productRequestsQueryObject = z.object(productRequestsQueryShape).strict();

const validDateRange = (query: { dateFrom?: string; dateTo?: string }) =>
  isDateRangeOrdered(query.dateFrom, query.dateTo);

const validCategory = (query: { category?: string; categoryMode?: string }) =>
  !(query.category && query.categoryMode === 'custom');

const dateRangeIssue = { path: ['dateTo'], message: DATE_RANGE_MESSAGE };

const categoryIssue = {
  path: ['category'],
  message: 'A category slug can be used only for catalog categories.',
};

//===============================================================

export const productRequestsQuerySchema = z.preprocess(
  normalizePaginationQuery,

  productRequestsQueryObject
    .refine(validDateRange, dateRangeIssue)
    .refine(validCategory, categoryIssue)
);

export const adminProductRequestsQuerySchema = z.preprocess(
  normalizePaginationQuery,

  productRequestsQueryObject
    .extend({ ownerId: mongoIdSchema.optional() })
    .refine(validDateRange, dateRangeIssue)
    .refine(validCategory, categoryIssue)
);

export type AdminProductRequestsQuery = z.infer<
  typeof adminProductRequestsQuerySchema
>;

//===============================================================

export const productRequestFormSchema = z
  .object({
    status: z.literal('new').default('new'),

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
      )
      .transform((value) => uppercaseInitial(value) ?? ''),

    article: z
      .string()
      .max(
        PRODUCT_REQUEST_LIMITS.articleMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article
      )

      .refine(
        (value) =>
          !value || PRODUCT_REQUEST_ARTICLE_PATTERN.test(value.toUpperCase()),
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article
      )

      .transform((value) => value.toUpperCase()),

    categoryMode: z.enum(PRODUCT_REQUEST_CATEGORY_MODES),
    categoryId: mongoIdSchema.optional(),

    customCategory: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.customCategoryMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.customCategory,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    productImage: productImageSchema.optional(),

    brand: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.brandMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.brand,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    series: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.seriesMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.series,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    releaseForm: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.releaseFormMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.releaseForm,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    activeIngredients: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.activeIngredientsMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeIngredients,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    activeIngredientCount: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.activeIngredientCountMax,
      maxMessage:
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeIngredientCount,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    manufacturer: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.manufacturerMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.manufacturer,
      pattern: PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText,
    }).transform(uppercaseInitial),

    fullDescription: optionalTrimmedTextSchema({
      maxLength: PRODUCT_REQUEST_LIMITS.fullDescriptionMax,
      maxMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescription,
      pattern: PRODUCT_REQUEST_LONG_TEXT_PATTERN,
      patternMessage: PRODUCT_REQUEST_VALIDATION_MESSAGES.format.longText,
    }).refine(
      (value) =>
        !value || value.length >= PRODUCT_REQUEST_LIMITS.fullDescriptionMin,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescriptionMin
    ),

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
    if (value.categoryMode === 'custom' && value.categoryId) {
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Custom category requests must not select a catalog category.',
      });
    }
  });

//===============================================================

export const productRequestArticleAvailabilityQuerySchema = z
  .object({
    article: z
      .string()
      .min(1, PRODUCT_REQUEST_VALIDATION_MESSAGES.required.article)

      .max(
        PRODUCT_REQUEST_LIMITS.articleMax,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article
      )

      .regex(
        PRODUCT_REQUEST_ARTICLE_PATTERN,
        PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article
      )

      .transform((value) => value.toUpperCase()),
    excludeRequestId: mongoIdSchema.optional(),
  })
  .strict();

//===============================================================

export const productRequestParamsSchema = z.object({
  requestId: mongoIdSchema,
});

//===============================================================

export const productRequestModerationSchema = z
  .object({
    status: z.enum(['on_moderation', 'approved', 'rejected']),
    reason: z.string().trim().max(1000).optional(),
    reviewState: z.literal('changes_requested').optional(),
    productId: mongoIdSchema.optional(),
    categoryId: mongoIdSchema.optional(),
  })

  .superRefine((value, context) => {
    if (
      (value.status === 'rejected' ||
        value.reviewState === 'changes_requested') &&
      !value.reason?.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Rejection reason is required.',
      });
    }

    if (
      value.status === 'on_moderation' &&
      value.reviewState !== 'changes_requested'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['reviewState'],
        message: 'Admin must explicitly request corrections during moderation.',
      });
    }

    if (value.reviewState && value.status !== 'on_moderation') {
      context.addIssue({
        code: 'custom',
        path: ['reviewState'],
        message: 'Corrections are only available during moderation.',
      });
    }

    if (value.status !== 'approved' && value.productId) {
      context.addIssue({
        code: 'custom',
        path: ['productId'],
        message: 'Catalog product can be linked only when approving a request.',
      });
    }

    if (value.status !== 'approved' && value.categoryId) {
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message:
          'Product category can be assigned only when approving a request.',
      });
    }
  });

//===============================================================

export type ProductRequestParams = z.infer<typeof productRequestParamsSchema>;
export type ProductRequestsQuery = z.infer<typeof productRequestsQuerySchema>;

export type ProductRequestArticleAvailabilityQuery = z.infer<
  typeof productRequestArticleAvailabilityQuerySchema
>;

export type ProductRequestFormInput = z.infer<typeof productRequestFormSchema>;

export type ProductRequestModerationInput = z.infer<
  typeof productRequestModerationSchema
>;
