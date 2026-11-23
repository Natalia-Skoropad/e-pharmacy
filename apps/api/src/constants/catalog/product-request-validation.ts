import { PHARMACY_DOCUMENT_RULES } from '../pharmacies/pharmacy-document-validation';

//=================================================================================

export const PRODUCT_REQUEST_STATUSES = [
  'new',
  'on_moderation',
  'approved',
  'rejected',
] as const;

//===============================================================

export const PRODUCT_REQUEST_LIMITS = {
  nameMax: 160,
  articleMax: 40,
  customCategoryMax: 100,
  brandMax: 160,
  seriesMax: 160,
  releaseFormMax: 100,
  activeIngredientsMax: 200,
  activeIngredientCountMax: 200,
  manufacturerMax: 160,
  fullDescriptionMin: 100,
  fullDescriptionMax: 5000,
  pharmacyCommentMax: 1500,
  fileNameMax: 180,
  fileTypeMax: 120,
} as const;

//===============================================================

export const PRODUCT_REQUEST_IMAGE_RULES = {
  maxFiles: 1,
  maxSizeBytes: 2 * 1024 * 1024,
  maxDataUrlLength: 3 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  fileNamePattern: /\.(?:jpe?g|png|webp)$/i,

  dataUrlPattern:
    /^(?:data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+|\/api\/media\/[a-f0-9]{24}\/large)$/,
} as const;

//===============================================================

export const PRODUCT_REQUEST_ATTACHMENT_RULES = {
  maxFiles: PHARMACY_DOCUMENT_RULES.maxFiles,
  maxSizeBytes: PHARMACY_DOCUMENT_RULES.maxSizeBytes,
  maxTotalSizeBytes: PHARMACY_DOCUMENT_RULES.maxTotalSizeBytes,
  maxDataUrlLength: 14 * 1024 * 1024,
  mimeTypes: PHARMACY_DOCUMENT_RULES.mimeTypes,
  fileNamePattern: PHARMACY_DOCUMENT_RULES.fileNamePattern,

  dataUrlPattern:
    /^data:(?:application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(?:jpeg|png|webp));base64,[A-Za-z0-9+/=]+$/,
} as const;

//===============================================================

export const PRODUCT_REQUEST_ARTICLE_PATTERN = /^[A-Z0-9._/\-]+$/;

export const PRODUCT_REQUEST_SHORT_TEXT_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9\s.,:;'’"()/%+&\-]*$/;

export const PRODUCT_REQUEST_LONG_TEXT_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()[\]_\-–—/#%+*&=~@\n\r]+$/;

//===============================================================

export const PRODUCT_REQUEST_VALIDATION_MESSAGES = {
  required: {
    category: 'Select a product category',
    name: 'Product name is required',
    article: 'Product article is required',
    customCategory: 'Enter the category name',
    productImage: 'Product image is required',
    brand: 'Brand is required',
    series: 'Series / Line is required',
    manufacturer: 'Manufacturer is required',
    fullDescription: 'About product is required',
  },

  format: {
    article:
      'Use uppercase English letters, numbers, dot, slash, underscore or hyphen without spaces',

    shortText: 'Use English letters, numbers, spaces and basic punctuation',
    longText: 'Use English letters, numbers, line breaks and basic punctuation',
    productImage: 'Choose a JPG, PNG, or WEBP image',
    attachment: 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP file',
    attachmentData: 'The attached file data does not match its MIME type',
    fileSizeMismatch: 'The uploaded file size does not match its content',
  },

  limits: {
    name: `Product name must be at most ${PRODUCT_REQUEST_LIMITS.nameMax} characters`,
    article: `Product article must be at most ${PRODUCT_REQUEST_LIMITS.articleMax} characters`,
    customCategory: `Category name must be at most ${PRODUCT_REQUEST_LIMITS.customCategoryMax} characters`,
    brand: `Brand must be at most ${PRODUCT_REQUEST_LIMITS.brandMax} characters`,
    series: `Series / Line must be at most ${PRODUCT_REQUEST_LIMITS.seriesMax} characters`,
    releaseForm: `Release form must be at most ${PRODUCT_REQUEST_LIMITS.releaseFormMax} characters`,
    activeIngredients: `Active ingredients must be at most ${PRODUCT_REQUEST_LIMITS.activeIngredientsMax} characters`,
    activeIngredientCount: `Active ingredient count must be at most ${PRODUCT_REQUEST_LIMITS.activeIngredientCountMax} characters`,
    manufacturer: `Manufacturer must be at most ${PRODUCT_REQUEST_LIMITS.manufacturerMax} characters`,
    fullDescription: `About product must be at most ${PRODUCT_REQUEST_LIMITS.fullDescriptionMax} characters`,
    fullDescriptionMin: `About product must be at least ${PRODUCT_REQUEST_LIMITS.fullDescriptionMin} characters when filled`,
    pharmacyComment: `Pharmacy note must be at most ${PRODUCT_REQUEST_LIMITS.pharmacyCommentMax} characters`,
    fileName: `File name must be at most ${PRODUCT_REQUEST_LIMITS.fileNameMax} characters`,
    fileType: `File type must be at most ${PRODUCT_REQUEST_LIMITS.fileTypeMax} characters`,
    fileSize: 'File size is invalid',
    productImageSize: 'The product image must be no larger than 2 MB',
    productImageData: 'The product image data is too large',
    attachmentSize: 'Additional files must be no larger than 10 MB',
    attachmentData: 'Additional file data is too large',
    attachmentDataRequired: 'Additional file content is required',
    attachmentsTotalSize: 'The combined attachment size must not exceed 30 MB',
    attachmentsCount: `A product request can contain at most ${PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles} additional files`,
  },
} as const;
