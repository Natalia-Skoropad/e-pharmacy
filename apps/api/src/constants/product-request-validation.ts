export const PRODUCT_REQUEST_STATUSES = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const;

//===============================================================

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
  productImageMaxSizeBytes: 2 * 1024 * 1024,
  additionalFileMaxSizeBytes: 10 * 1024 * 1024,
  additionalFilesMax: 5,
  dataUrlMaxLength: 3 * 1024 * 1024,
} as const;

//===============================================================

export const PRODUCT_REQUEST_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

//===============================================================

export const PRODUCT_REQUEST_ADDITIONAL_FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...PRODUCT_REQUEST_IMAGE_MIME_TYPES,
] as const;

//===============================================================

export const PRODUCT_REQUEST_IMAGE_FILE_NAME_PATTERN = /\.(?:jpe?g|png|webp)$/i;

export const PRODUCT_REQUEST_ADDITIONAL_FILE_NAME_PATTERN =
  /\.(?:pdf|docx?|jpe?g|png|webp)$/i;

export const PRODUCT_REQUEST_IMAGE_DATA_URL_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,/i;

//===============================================================

export const PRODUCT_REQUEST_VALIDATION_MESSAGES = {
  required: {
    name: 'Product name is required.',
    article: 'Product article is required.',
    customCategory: 'Enter the category name.',
    productImage: 'Product image is required.',
    manufacturer: 'Manufacturer is required.',
    countryOfOrigin: 'Country is required.',
    dosage: 'Dosage is required.',
    packageSize: 'Package size is required.',
    form: 'Product form is required.',
    activeSubstance: 'Active substance is required.',
    prescriptionType: 'Prescription type is required.',
    fullDescription: 'Full description is required.',
  },

  format: {
    productImage: 'Choose a JPG, PNG, or WEBP image.',
    additionalFile: 'Choose a PDF, DOC, DOCX, JPG, PNG, or WEBP file.',
  },

  limits: {
    name: `Product name must be at most ${PRODUCT_REQUEST_LIMITS.nameMax} characters.`,
    article: `Product article must be at most ${PRODUCT_REQUEST_LIMITS.articleMax} characters.`,
    customCategory: `Category name must be at most ${PRODUCT_REQUEST_LIMITS.customCategoryMax} characters.`,
    manufacturer: `Manufacturer must be at most ${PRODUCT_REQUEST_LIMITS.manufacturerMax} characters.`,
    countryOfOrigin: `Country must be at most ${PRODUCT_REQUEST_LIMITS.countryOfOriginMax} characters.`,
    dosage: `Dosage must be at most ${PRODUCT_REQUEST_LIMITS.dosageMax} characters.`,
    packageSize: `Package size must be at most ${PRODUCT_REQUEST_LIMITS.packageSizeMax} characters.`,
    form: `Product form must be at most ${PRODUCT_REQUEST_LIMITS.formMax} characters.`,
    activeSubstance: `Active substance must be at most ${PRODUCT_REQUEST_LIMITS.activeSubstanceMax} characters.`,
    prescriptionType: `Prescription type must be at most ${PRODUCT_REQUEST_LIMITS.prescriptionTypeMax} characters.`,
    fullDescription: `Full description must be at most ${PRODUCT_REQUEST_LIMITS.fullDescriptionMax} characters.`,
    pharmacyComment: `Pharmacy note must be at most ${PRODUCT_REQUEST_LIMITS.pharmacyCommentMax} characters.`,
    fileName: `File name must be at most ${PRODUCT_REQUEST_LIMITS.fileNameMax} characters.`,
    fileType: `File type must be at most ${PRODUCT_REQUEST_LIMITS.fileTypeMax} characters.`,
    productImageSize: 'The product image must be no larger than 2 MB.',
    additionalFileSize: 'Additional files must be no larger than 10 MB.',
    additionalFilesCount: `A product request can contain at most ${PRODUCT_REQUEST_LIMITS.additionalFilesMax} additional files.`,
  },
} as const;
