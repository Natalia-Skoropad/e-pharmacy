import { isValidationResultValid } from '../shared';

import {
  PRODUCT_REQUEST_ARTICLE_PATTERN,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_LONG_TEXT_PATTERN,
  PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
} from './product-request-constants';

import {
  validateProductRequestAdditionalFiles,
  validateProductRequestImageFile,
} from './product-request-files';

import type {
  ProductRequestFormErrors,
  ProductRequestFormValidationContext,
  ProductRequestFormValues,
  ProductRequestValidationMode,
} from './product-request-types';

//===================================================================

function buildRequiredError(value: string, message: string): string {
  return value.trim() ? '' : message;
}

//===================================================================

function buildMaxLengthError(
  value: string,
  maxLength: number,
  message: string
): string {
  return value.trim().length > maxLength ? message : '';
}

//===================================================================

function buildPatternError(
  value: string,
  pattern: RegExp,
  message: string
): string {
  const normalizedValue = value.trim();

  return normalizedValue && !pattern.test(normalizedValue) ? message : '';
}

//===================================================================

export function validateProductRequestForm(
  values: ProductRequestFormValues,
  mode: ProductRequestValidationMode,
  context: ProductRequestFormValidationContext = {}
): ProductRequestFormErrors {
  const errors: ProductRequestFormErrors = {};

  if (values.categoryMode === 'catalog') {
    if (mode === 'moderation' && !values.categoryId.trim()) {
      errors.categoryId = PRODUCT_REQUEST_VALIDATION_MESSAGES.required.category;
    }
  } else if (values.categoryMode === 'custom') {
    if (mode === 'moderation' && !values.customCategory.trim()) {
      errors.customCategory =
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.customCategory;
    }
  } else {
    errors.categoryMode = PRODUCT_REQUEST_VALIDATION_MESSAGES.required.category;
  }

  const requiredNameError = buildRequiredError(
    values.name,
    PRODUCT_REQUEST_VALIDATION_MESSAGES.required.name
  );

  const requiredArticleError = buildRequiredError(
    values.article,
    PRODUCT_REQUEST_VALIDATION_MESSAGES.required.article
  );

  if (requiredNameError) errors.name = requiredNameError;
  if (mode === 'moderation' && requiredArticleError) {
    errors.article = requiredArticleError;
  }

  const fieldLimits: Array<
    readonly [keyof ProductRequestFormValues, number, string]
  > = [
    [
      'name',
      PRODUCT_REQUEST_LIMITS.nameMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.name,
    ],
    [
      'article',
      PRODUCT_REQUEST_LIMITS.articleMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.article,
    ],
    [
      'customCategory',
      PRODUCT_REQUEST_LIMITS.customCategoryMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.customCategory,
    ],
    [
      'brand',
      PRODUCT_REQUEST_LIMITS.brandMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.brand,
    ],
    [
      'series',
      PRODUCT_REQUEST_LIMITS.seriesMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.series,
    ],
    [
      'releaseForm',
      PRODUCT_REQUEST_LIMITS.releaseFormMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.releaseForm,
    ],
    [
      'activeIngredients',
      PRODUCT_REQUEST_LIMITS.activeIngredientsMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeIngredients,
    ],
    [
      'activeIngredientCount',
      PRODUCT_REQUEST_LIMITS.activeIngredientCountMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeIngredientCount,
    ],
    [
      'manufacturer',
      PRODUCT_REQUEST_LIMITS.manufacturerMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.manufacturer,
    ],
    [
      'fullDescription',
      PRODUCT_REQUEST_LIMITS.fullDescriptionMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescription,
    ],
    [
      'pharmacyComment',
      PRODUCT_REQUEST_LIMITS.pharmacyCommentMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.pharmacyComment,
    ],
  ];

  for (const [field, maxLength, message] of fieldLimits) {
    if (errors[field]) continue;

    const error = buildMaxLengthError(values[field], maxLength, message);

    if (error) errors[field] = error;
  }

  // Do not trim: leading, trailing, and internal spaces are invalid.
  const articleFormatError =
    values.article &&
    !PRODUCT_REQUEST_ARTICLE_PATTERN.test(values.article.toUpperCase())
      ? PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article
      : '';

  if (!errors.article && articleFormatError)
    errors.article = articleFormatError;

  const shortTextFields: Array<keyof ProductRequestFormValues> = [
    'name',
    'customCategory',
    'brand',
    'series',
    'releaseForm',
    'activeIngredients',
    'activeIngredientCount',
    'manufacturer',
  ];

  for (const field of shortTextFields) {
    if (errors[field]) continue;

    const error = buildPatternError(
      values[field],
      PRODUCT_REQUEST_SHORT_TEXT_PATTERN,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.format.shortText
    );

    if (error) errors[field] = error;
  }

  const longTextFields: Array<keyof ProductRequestFormValues> = [
    'fullDescription',
    'pharmacyComment',
  ];

  for (const field of longTextFields) {
    if (errors[field]) continue;

    const error = buildPatternError(
      values[field],
      PRODUCT_REQUEST_LONG_TEXT_PATTERN,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.format.longText
    );

    if (error) errors[field] = error;
  }

  // Match the About pharmacy editor: a draft may omit the description,
  // but a description that has been started must contain at least 100 characters.
  if (
    !errors.fullDescription &&
    values.fullDescription.trim().length > 0 &&
    values.fullDescription.trim().length <
      PRODUCT_REQUEST_LIMITS.fullDescriptionMin
  ) {
    errors.fullDescription =
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.fullDescriptionMin;
  }

  const productImage = context.productImage;
  const hasProductImage = context.hasProductImage ?? Boolean(productImage);

  if (productImage) {
    const imageError = validateProductRequestImageFile(productImage);

    if (imageError) errors.productImage = imageError;
  }

  if (context.additionalFiles) {
    const filesError = validateProductRequestAdditionalFiles(
      context.additionalFiles,
      { requireDataUrl: true }
    );

    if (filesError) errors.additionalFiles = filesError;
  }

  if (mode === 'moderation') {
    if (!hasProductImage) {
      errors.productImage =
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.productImage;
    }

    const moderationRequiredFields: Array<
      readonly [keyof ProductRequestFormValues, string]
    > = [
      ['brand', PRODUCT_REQUEST_VALIDATION_MESSAGES.required.brand],
      ['series', PRODUCT_REQUEST_VALIDATION_MESSAGES.required.series],
      [
        'fullDescription',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.fullDescription,
      ],
      [
        'manufacturer',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.manufacturer,
      ],
    ];

    for (const [field, message] of moderationRequiredFields) {
      if (!errors[field] && !values[field].trim()) errors[field] = message;
    }
  }

  return errors;
}

//===================================================================

export function isProductRequestDraftValid(
  values: ProductRequestFormValues,
  context: ProductRequestFormValidationContext = {}
): boolean {
  return isValidationResultValid(
    validateProductRequestForm(values, 'draft', context)
  );
}

//===================================================================

export function isProductRequestSubmissionValid(
  values: ProductRequestFormValues,
  context: ProductRequestFormValidationContext = {}
): boolean {
  return isValidationResultValid(
    validateProductRequestForm(values, 'moderation', context)
  );
}
