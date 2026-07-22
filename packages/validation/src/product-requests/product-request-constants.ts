export const PRODUCT_REQUEST_LIMITS = {
  nameMax: 160,
  articleMax: 40,
  customCategoryMax: 100,
  manufacturerMax: 160,
  countryOfOriginMax: 100,
  dosageMax: 100,
  packageSizeMax: 100,
  formMax: 100,
  activeSubstanceMax: 180,
  prescriptionTypeMax: 80,
  fullDescriptionMax: 5000,
  pharmacyCommentMax: 1500,
  fileNameMax: 180,
  fileTypeMax: 120,
} as const;

//===================================================================

export const PRODUCT_REQUEST_IMAGE_RULES = {
  maxFiles: 1,
  maxSizeBytes: 2 * 1024 * 1024,
  maxDataUrlLength: 3 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  extensions: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

//===================================================================

export const PRODUCT_REQUEST_ATTACHMENT_RULES = {
  maxFiles: 5,
  maxSizeBytes: 5 * 1024 * 1024,
  maxTotalSizeBytes: 20 * 1024 * 1024,
  maxDataUrlLength: 7 * 1024 * 1024,
  mimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ...PRODUCT_REQUEST_IMAGE_RULES.mimeTypes,
  ],

  extensions: [
    '.pdf',
    '.doc',
    '.docx',
    ...PRODUCT_REQUEST_IMAGE_RULES.extensions,
  ],
} as const;

//===================================================================

export const PRODUCT_REQUEST_IMAGE_MAX_SIZE_MB =
  PRODUCT_REQUEST_IMAGE_RULES.maxSizeBytes / (1024 * 1024);

//===================================================================

export const PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB =
  PRODUCT_REQUEST_ATTACHMENT_RULES.maxSizeBytes / (1024 * 1024);

//===================================================================

export const PRODUCT_REQUEST_IMAGE_ACCEPT = [
  ...PRODUCT_REQUEST_IMAGE_RULES.mimeTypes,
  ...PRODUCT_REQUEST_IMAGE_RULES.extensions,
].join(',');

//===================================================================

export const PRODUCT_REQUEST_ATTACHMENTS_ACCEPT = [
  ...PRODUCT_REQUEST_ATTACHMENT_RULES.mimeTypes,
  ...PRODUCT_REQUEST_ATTACHMENT_RULES.extensions,
].join(',');

//===================================================================

export const PRODUCT_REQUEST_ARTICLE_PATTERN = /^[A-Za-z0-9._/\-]+$/;

export const PRODUCT_REQUEST_SHORT_TEXT_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9\s.,'’"()/%+&\-]*$/;

export const PRODUCT_REQUEST_LONG_TEXT_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*&\n\r]+$/;

//===================================================================

export const PRODUCT_REQUEST_VALIDATION_MESSAGES = {
  required: {
    category: 'Select a product category',
    name: 'Product name is required',
    article: 'Product article is required',
    customCategory: 'Enter the category name',
    productImage: 'Product image is required',
    manufacturer: 'Manufacturer is required',
    countryOfOrigin: 'Country is required',
    dosage: 'Dosage is required',
    packageSize: 'Package size is required',
    form: 'Product form is required',
    activeSubstance: 'Active substance is required',
    prescriptionType: 'Prescription type is required',
    fullDescription: 'Full description is required',
  },

  limits: {
    name: `Product name must be at most ${PRODUCT_REQUEST_LIMITS.nameMax} characters`,
    article: `Product article must be at most ${PRODUCT_REQUEST_LIMITS.articleMax} characters`,
    customCategory: `Category name must be at most ${PRODUCT_REQUEST_LIMITS.customCategoryMax} characters`,
    manufacturer: `Manufacturer must be at most ${PRODUCT_REQUEST_LIMITS.manufacturerMax} characters`,
    countryOfOrigin: `Country must be at most ${PRODUCT_REQUEST_LIMITS.countryOfOriginMax} characters`,
    dosage: `Dosage must be at most ${PRODUCT_REQUEST_LIMITS.dosageMax} characters`,
    packageSize: `Package size must be at most ${PRODUCT_REQUEST_LIMITS.packageSizeMax} characters`,
    form: `Product form must be at most ${PRODUCT_REQUEST_LIMITS.formMax} characters`,
    activeSubstance: `Active substance must be at most ${PRODUCT_REQUEST_LIMITS.activeSubstanceMax} characters`,
    prescriptionType: `Prescription type must be at most ${PRODUCT_REQUEST_LIMITS.prescriptionTypeMax} characters`,
    fullDescription: `Full description must be at most ${PRODUCT_REQUEST_LIMITS.fullDescriptionMax} characters`,
    pharmacyComment: `Pharmacy note must be at most ${PRODUCT_REQUEST_LIMITS.pharmacyCommentMax} characters`,
    fileName: `File name must be at most ${PRODUCT_REQUEST_LIMITS.fileNameMax} characters`,
    fileType: `File type must be at most ${PRODUCT_REQUEST_LIMITS.fileTypeMax} characters`,
    fileSize: 'File size is invalid',
    productImageSize: `The product image must be no larger than ${PRODUCT_REQUEST_IMAGE_MAX_SIZE_MB} MB`,
    productImageData: 'The product image data is too large',

    attachmentSize: (fileName: string) =>
      `The file “${fileName}” must be no larger than ${PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB} MB`,

    attachmentData: (fileName: string) =>
      `The file data for “${fileName}” is too large`,

    attachmentDataRequired: (fileName: string) =>
      `Upload “${fileName}” again because its file content is missing`,

    attachmentsTotalSize: 'The combined attachment size must not exceed 20 MB',
    attachmentsCount: `You can attach up to ${PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles} files`,
  },

  format: {
    article: 'Use English letters, numbers, dot, slash, underscore or hyphen',
    shortText: 'Use English letters, numbers, spaces and basic punctuation',

    longText:
      'Use English letters, numbers, line breaks and basic punctuation',

    productImage: 'Choose a JPG, PNG, or WEBP image',
    attachment: 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP file',
    attachmentData: 'The attached file data does not match its MIME type',
    fileSizeMismatch: 'The uploaded file size does not match its content',
  },
} as const;
