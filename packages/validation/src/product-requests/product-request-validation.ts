import { isProductCategory } from '../products';
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

  if (!isProductCategory(values.category)) {
    errors.category = PRODUCT_REQUEST_VALIDATION_MESSAGES.required.category;
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
  if (requiredArticleError) errors.article = requiredArticleError;

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
      'manufacturer',
      PRODUCT_REQUEST_LIMITS.manufacturerMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.manufacturer,
    ],
    [
      'countryOfOrigin',
      PRODUCT_REQUEST_LIMITS.countryOfOriginMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.countryOfOrigin,
    ],
    [
      'dosage',
      PRODUCT_REQUEST_LIMITS.dosageMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.dosage,
    ],
    [
      'packageSize',
      PRODUCT_REQUEST_LIMITS.packageSizeMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.packageSize,
    ],
    [
      'form',
      PRODUCT_REQUEST_LIMITS.formMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.form,
    ],
    [
      'activeSubstance',
      PRODUCT_REQUEST_LIMITS.activeSubstanceMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.activeSubstance,
    ],
    [
      'prescriptionType',
      PRODUCT_REQUEST_LIMITS.prescriptionTypeMax,
      PRODUCT_REQUEST_VALIDATION_MESSAGES.limits.prescriptionType,
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

  const articleFormatError = buildPatternError(
    values.article,
    PRODUCT_REQUEST_ARTICLE_PATTERN,
    PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article
  );

  if (!errors.article && articleFormatError)
    errors.article = articleFormatError;

  const shortTextFields: Array<keyof ProductRequestFormValues> = [
    'name',
    'customCategory',
    'manufacturer',
    'countryOfOrigin',
    'dosage',
    'packageSize',
    'form',
    'activeSubstance',
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

  if (values.category === 'other' && !values.customCategory.trim()) {
    errors.customCategory =
      PRODUCT_REQUEST_VALIDATION_MESSAGES.required.customCategory;
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
      [
        'manufacturer',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.manufacturer,
      ],
      [
        'countryOfOrigin',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.countryOfOrigin,
      ],
      ['dosage', PRODUCT_REQUEST_VALIDATION_MESSAGES.required.dosage],
      ['packageSize', PRODUCT_REQUEST_VALIDATION_MESSAGES.required.packageSize],
      ['form', PRODUCT_REQUEST_VALIDATION_MESSAGES.required.form],
      [
        'activeSubstance',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.activeSubstance,
      ],
      [
        'prescriptionType',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.prescriptionType,
      ],
      [
        'fullDescription',
        PRODUCT_REQUEST_VALIDATION_MESSAGES.required.fullDescription,
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
