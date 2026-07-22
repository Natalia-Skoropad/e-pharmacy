export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 50;

export const PHARMACY_NAME_MIN_LENGTH = 2;
export const PHARMACY_NAME_MAX_LENGTH = 100;

export const BANK_RECIPIENT_NAME_MIN_LENGTH = 2;
export const BANK_RECIPIENT_NAME_MAX_LENGTH = 160;

export const BANK_NAME_MIN_LENGTH = 2;
export const BANK_NAME_MAX_LENGTH = 120;

export const USER_EMAIL_MAX_LENGTH = 64;

export const USER_PHONE_MIN_LENGTH = 13;
export const USER_PHONE_MAX_LENGTH = 13;

export const USER_PASSWORD_MIN_LENGTH = 8;
export const USER_PASSWORD_MAX_LENGTH = 20;

export const USER_ADDRESS_MIN_LENGTH = 10;
export const USER_ADDRESS_MAX_LENGTH = 200;

export const USER_SEARCH_MAX_LENGTH = 80;

export const USER_REVIEW_COMMENT_MIN_LENGTH = 10;
export const USER_REVIEW_COMMENT_MAX_LENGTH = 500;

export const MIN_REVIEW_RATING = 1;
export const MAX_REVIEW_RATING = 5;

export const USER_ORDER_COMMENT_MAX_LENGTH = 500;

export const WORKING_HOURS_MAX_LENGTH = 160;
export const TEXT_EDITOR_MAX_LENGTH = 5000;
export const TAX_ID_MIN_LENGTH = 8;
export const TAX_ID_MAX_LENGTH = 10;
export const IBAN_MAX_LENGTH = 29;
export const PAYMENT_PURPOSE_MAX_LENGTH = 500;

export const PICTURE_FILE_MAX_BYTES = 450 * 1024;
export const PICTURE_DATA_URL_MAX_LENGTH = 700_000;
export const PICTURE_HTTP_URL_MAX_LENGTH = 2_048;

//===============================================================

export const USER_NAME_PATTERN = /^[A-Za-z]+(?:[ '’\-][A-Za-z]+)*$/;

export const PHARMACY_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9 '’&().,/\-]*$/;

export const BANK_RECIPIENT_NAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9 '’&().,/\-]*$/;

export const BANK_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 '’&().,/\-]*$/;

export const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export const PHONE_PATTERN = /^\+380\d{9}$/;
export const PASSWORD_PATTERN = /^\S+$/;
export const ADDRESS_PATTERN = /^[A-Za-z0-9 .,'’/#&()\-]+$/;
export const SEARCH_TEXT_PATTERN = /^[A-Za-z0-9 .,'’/#&()\-]*$/;

export const REVIEW_COMMENT_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]+$/;

export const ORDER_COMMENT_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]*$/;

export const PAYMENT_PURPOSE_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*]+$/;

export const TAX_ID_PATTERN = /^\d{8,10}$/;
export const IBAN_PATTERN = /^UA\d{27}$/;

export const WORKING_HOURS_PATTERN =
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(?:Closed|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d)(?:;\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(?:Closed|(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d))*$/;

export const TEXT_EDITOR_PATTERN =
  /^[A-Za-z0-9\s.,!?;:'"“”()\-–—/#%+*\n\r]+$/;

export const PICTURE_DATA_URL_PATTERN =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

//===============================================================

export const VALIDATION_MESSAGES = {
  required: {
    name: 'Name is required',
    pharmacyName: 'Pharmacy name is required',
    bankRecipientName: 'Bank recipient name is required',
    bankName: 'Bank name is required',
    email: 'Email is required',
    phone: 'Phone is required',
    password: 'Password is required',
    currentPassword: 'Current password is required',
    confirmPassword: 'Confirm password is required',
    address: 'Address is required',
    reviewComment: 'Review comment is required',
    orderComment: 'Order comment is required',
    workingHours: 'Working hours are required',
    textEditor: 'Text is required',
    taxId: 'Tax ID / EDRPOU is required',
    iban: 'IBAN is required',
    paymentPurpose: 'Payment purpose is required',
    picture: 'Photo is required',
    resetToken: 'Reset token is required',
  },

  format: {
    name: 'Use letters, spaces, apostrophe or hyphen',

    pharmacyName: 'Use letters, numbers, spaces and common name punctuation',

    bankRecipientName:
      'Use letters, numbers, spaces and common name punctuation',

    bankName: 'Use letters, numbers, spaces and common name punctuation',
    email: 'Enter a valid email address',
    emailApi: 'Email must be valid',
    phone: 'Enter phone in format +380XXXXXXXXX',
    password: 'Password must not contain spaces',
    passwordMatch: 'Passwords do not match',

    address:
      'Use letters, numbers, spaces, comma, dot, slash, apostrophe, #, &, parentheses or hyphen',

    reviewComment:
      'Review may contain English letters, numbers, spaces and basic punctuation',

    reviewRating: `Choose a rating from ${MIN_REVIEW_RATING} to ${MAX_REVIEW_RATING} stars`,

    orderComment:
      'Order comment may contain English letters, numbers, spaces and basic punctuation',

    workingHours:
      'Use the format Mon: 09:00-18:00; Tue: Closed and include all seven days',
    workingHoursRange: 'Closing time must be later than opening time',
    workingHoursMissingDays: 'Working hours must include every day from Mon to Sun',
    workingHoursDuplicateDays: 'Each weekday must appear exactly once',
    textEditor: 'Use English letters, numbers, line breaks and basic punctuation',
    taxId: 'Use 8–10 digits',
    iban: 'Use Ukrainian IBAN format: UA + 27 digits',

    paymentPurpose:
      'Payment purpose may contain English letters, numbers, spaces and basic punctuation',

    picture: 'Photo must be a valid image URL or JPG/PNG/WEBP upload',
    pictureFileType: 'Please choose a JPG, PNG, or WEBP image',
    search: 'Search may contain only allowed text characters',
  },

  limits: {
    nameMin: `Name must be at least ${USER_NAME_MIN_LENGTH} characters`,
    nameMax: `Name must be at most ${USER_NAME_MAX_LENGTH} characters`,
    pharmacyNameMin: `Pharmacy name must be at least ${PHARMACY_NAME_MIN_LENGTH} characters`,
    pharmacyNameMax: `Pharmacy name must be at most ${PHARMACY_NAME_MAX_LENGTH} characters`,
    bankRecipientNameMin: `Bank recipient name must be at least ${BANK_RECIPIENT_NAME_MIN_LENGTH} characters`,
    bankRecipientNameMax: `Bank recipient name must be at most ${BANK_RECIPIENT_NAME_MAX_LENGTH} characters`,
    bankNameMin: `Bank name must be at least ${BANK_NAME_MIN_LENGTH} characters`,
    bankNameMax: `Bank name must be at most ${BANK_NAME_MAX_LENGTH} characters`,
    emailMax: `Email must be at most ${USER_EMAIL_MAX_LENGTH} characters`,
    phoneMin: `Phone must be at least ${USER_PHONE_MIN_LENGTH} characters`,
    phoneMax: `Phone must be at most ${USER_PHONE_MAX_LENGTH} characters`,
    passwordMin: `Password must be at least ${USER_PASSWORD_MIN_LENGTH} characters`,
    passwordMax: `Password must be at most ${USER_PASSWORD_MAX_LENGTH} characters`,
    addressMin: `Address must be at least ${USER_ADDRESS_MIN_LENGTH} characters`,
    addressMax: `Address must be at most ${USER_ADDRESS_MAX_LENGTH} characters`,
    searchMax: `Search must be at most ${USER_SEARCH_MAX_LENGTH} characters`,
    reviewCommentMin: `Review comment must be at least ${USER_REVIEW_COMMENT_MIN_LENGTH} characters`,
    reviewCommentMax: `Review comment must be at most ${USER_REVIEW_COMMENT_MAX_LENGTH} characters`,
    orderCommentMax: `Order comment must be at most ${USER_ORDER_COMMENT_MAX_LENGTH} characters`,
    workingHoursMax: `Working hours must be at most ${WORKING_HOURS_MAX_LENGTH} characters`,
    textEditorMax: `Text must be at most ${TEXT_EDITOR_MAX_LENGTH} characters`,
    paymentPurposeMax: `Payment purpose must be at most ${PAYMENT_PURPOSE_MAX_LENGTH} characters`,
    pictureDataUrlMax: 'Photo is too large. Use an image up to 450 KB',
    pictureHttpUrlMax: 'Photo URL must be at most 2048 characters',
    pictureFileSize: 'Photo must be up to 450 KB',
  },

  object: {
    atLeastOneField: 'At least one field is required',
  },
} as const;

//===============================================================

export function isPictureDataUrl(value: string): boolean {
  return PICTURE_DATA_URL_PATTERN.test(value);
}

//===============================================================

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
