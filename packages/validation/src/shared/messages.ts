import {
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_AVATAR_URL_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_REVIEW_COMMENT_MIN_LENGTH,
  USER_SEARCH_MAX_LENGTH,
} from './limits';

//=============================================================================

export const VALIDATION_MESSAGES = {
  required: {
    name: 'Name is required',
    email: 'Email is required',
    phone: 'Phone is required',
    password: 'Password is required',
    currentPassword: 'Current password is required',
    confirmPassword: 'Confirm password is required',
    address: 'Address is required',
    reviewComment: 'Review comment is required',
    orderComment: 'Order comment is required',
    avatar: 'Avatar is required',
    resetToken: 'Reset token is required',
  },

  format: {
    name: 'Use only Latin letters, spaces, apostrophe or hyphen',
    email: 'Enter a valid email address',
    emailApi: 'Email must be valid',
    phone: 'Enter phone in format +380XXXXXXXXX',
    password: 'Password must not contain spaces',
    passwordMatch: 'Passwords do not match',
    address:
      'Use Latin letters, numbers, spaces, comma, dot, slash, apostrophe, # or hyphen',
    reviewComment:
      'Review may contain only Latin letters, numbers, spaces and basic punctuation',
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
    avatarMax: `Avatar image must be at most ${USER_AVATAR_URL_MAX_LENGTH} characters`,
  },

  object: {
    atLeastOneField: 'At least one field is required',
  },
} as const;
