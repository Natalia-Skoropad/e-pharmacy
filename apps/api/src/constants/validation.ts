export const VALIDATION_LIMITS = {
  nameMin: 2,
  nameMax: 50,

  emailMax: 64,

  phoneMin: 13,
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

  avatarUrlMax: 700000,
} as const;

//===============================================================

export const USER_NAME_MIN_LENGTH = VALIDATION_LIMITS.nameMin;
export const USER_NAME_MAX_LENGTH = VALIDATION_LIMITS.nameMax;

export const USER_EMAIL_MAX_LENGTH = VALIDATION_LIMITS.emailMax;

export const USER_PHONE_MIN_LENGTH = VALIDATION_LIMITS.phoneMin;
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

export const USER_AVATAR_URL_MAX_LENGTH = VALIDATION_LIMITS.avatarUrlMax;

//===============================================================

export const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
export const PHONE_PATTERN = /^\+380\d{9}$/;
export const PASSWORD_PATTERN = /^\S+$/;
export const ADDRESS_PATTERN = /^[A-Za-z0-9\s.,'’/#-]+$/;
export const SEARCH_TEXT_PATTERN = /^[A-Za-z0-9\s.,'’/#-]*$/;
export const REVIEW_COMMENT_PATTERN = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/;
export const ORDER_COMMENT_PATTERN = /^[A-Za-z0-9\s.,!?;:'"()\-]*$/;
export const AVATAR_DATA_URL_PATTERN =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

//===============================================================

export const VALIDATION_MESSAGES = {
  required: {
    name: 'Name is required',
    email: 'Email is required',
    phone: 'Phone is required',
    password: 'Password is required',
    currentPassword: 'Current password is required',
    address: 'Address is required',
    reviewComment: 'Review comment is required',
    orderComment: 'Order comment is required',
    resetToken: 'Reset token is required',
  },

  format: {
    name: 'Use only Latin letters, spaces, apostrophe or hyphen',
    email: 'Email must be valid',
    phone: 'Enter phone in format +380XXXXXXXXX',
    password: 'Password must not contain spaces',
    address:
      'Use Latin letters, numbers, spaces, comma, dot, slash, apostrophe, # or hyphen',
    reviewComment:
      'Review may contain only Latin letters, numbers, spaces and basic punctuation',
    reviewRating: `Choose a rating from ${MIN_REVIEW_RATING} to ${MAX_REVIEW_RATING} stars`,
    orderComment:
      'Order comment may contain only Latin letters, numbers, spaces and basic punctuation',
    avatar: 'Avatar must be a valid image URL or JPG/PNG/WEBP upload',
    search: 'Search may contain only allowed text characters',
  },

  limits: {
    nameMin: `Name must be at least ${USER_NAME_MIN_LENGTH} characters`,
    nameMax: `Name must be at most ${USER_NAME_MAX_LENGTH} characters`,
    emailMax: `Email must be at most ${USER_EMAIL_MAX_LENGTH} characters`,
    phoneMax: `Phone must be at most ${USER_PHONE_MAX_LENGTH} characters`,
    passwordMin: `Password must be at least ${USER_PASSWORD_MIN_LENGTH} characters`,
    passwordMax: `Password must be at most ${USER_PASSWORD_MAX_LENGTH} characters`,
    addressMin: `Address must be at least ${USER_ADDRESS_MIN_LENGTH} characters`,
    addressMax: `Address must be at most ${USER_ADDRESS_MAX_LENGTH} characters`,
    searchMax: `Search must be at most ${USER_SEARCH_MAX_LENGTH} characters`,
    reviewCommentMin: `Review comment must be at least ${USER_REVIEW_COMMENT_MIN_LENGTH} characters`,
    reviewCommentMax: `Review comment must be at most ${USER_REVIEW_COMMENT_MAX_LENGTH} characters`,
    orderCommentMax: `Order comment must be at most ${USER_ORDER_COMMENT_MAX_LENGTH} characters`,
    avatarMax: 'Profile photo is too large. Use a smaller image',
    avatarPayloadMax: 'Profile photo is too large. Use an image up to 450 KB',
  },

  object: {
    atLeastOneField: 'At least one field is required',
  },
} as const;

//===============================================================

export function isAvatarDataUrl(value: string): boolean {
  return AVATAR_DATA_URL_PATTERN.test(value);
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
