export const VALIDATION_LIMITS = {
  nameMin: 2,
  nameMax: 50,

  emailMax: 64,
  phoneMax: 13,

  passwordMin: 8,
  passwordMax: 20,

  addressMin: 10,
  addressMax: 200,

  searchMax: 80,

  reviewCommentMin: 10,
  reviewCommentMax: 500,

  reviewRatingMin: 1,
  reviewRatingMax: 5,

  orderCommentMax: 500,

  workingHoursMax: 160,
  textEditorMax: 5000,
  taxIdMin: 8,
  taxIdMax: 10,
  ibanMax: 29,
  paymentPurposeMax: 500,

  pictureUrlMax: 700000,
  pictureFileMaxSizeBytes: 450 * 1024,
} as const;

//=============================================================================

export const USER_NAME_MIN_LENGTH = VALIDATION_LIMITS.nameMin;
export const USER_NAME_MAX_LENGTH = VALIDATION_LIMITS.nameMax;

export const USER_EMAIL_MAX_LENGTH = VALIDATION_LIMITS.emailMax;
export const USER_PHONE_MAX_LENGTH = VALIDATION_LIMITS.phoneMax;

export const USER_PASSWORD_MIN_LENGTH = VALIDATION_LIMITS.passwordMin;
export const USER_PASSWORD_MAX_LENGTH = VALIDATION_LIMITS.passwordMax;

export const USER_ADDRESS_MIN_LENGTH = VALIDATION_LIMITS.addressMin;
export const USER_ADDRESS_MAX_LENGTH = VALIDATION_LIMITS.addressMax;

export const USER_SEARCH_MAX_LENGTH = VALIDATION_LIMITS.searchMax;

export const USER_REVIEW_COMMENT_MIN_LENGTH =
  VALIDATION_LIMITS.reviewCommentMin;
export const USER_REVIEW_COMMENT_MAX_LENGTH =
  VALIDATION_LIMITS.reviewCommentMax;

export const MIN_REVIEW_RATING = VALIDATION_LIMITS.reviewRatingMin;
export const MAX_REVIEW_RATING = VALIDATION_LIMITS.reviewRatingMax;

export const USER_ORDER_COMMENT_MAX_LENGTH = VALIDATION_LIMITS.orderCommentMax;

export const WORKING_HOURS_MAX_LENGTH = VALIDATION_LIMITS.workingHoursMax;
export const TEXT_EDITOR_MAX_LENGTH = VALIDATION_LIMITS.textEditorMax;
export const TAX_ID_MIN_LENGTH = VALIDATION_LIMITS.taxIdMin;
export const TAX_ID_MAX_LENGTH = VALIDATION_LIMITS.taxIdMax;
export const IBAN_MAX_LENGTH = VALIDATION_LIMITS.ibanMax;
export const PAYMENT_PURPOSE_MAX_LENGTH = VALIDATION_LIMITS.paymentPurposeMax;

export const PICTURE_URL_MAX_LENGTH = VALIDATION_LIMITS.pictureUrlMax;
export const PICTURE_FILE_MAX_SIZE_BYTES =
  VALIDATION_LIMITS.pictureFileMaxSizeBytes;
