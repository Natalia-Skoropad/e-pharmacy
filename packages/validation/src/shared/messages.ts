import {
  BANK_NAME_MAX_LENGTH,
  BANK_NAME_MIN_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MIN_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_NAME_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
} from './limits';

//=============================================================================

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
      'Review may contain letters, numbers, spaces and basic punctuation',

    reviewRating: 'Choose a rating from 1 to 5 stars',

    orderComment:
      'Order comment may contain letters, numbers, spaces and basic punctuation',

    workingHours: 'Use letters, numbers, spaces and basic punctuation',
    workingHoursRange: 'Closing time must be later than opening time',
    textEditor: 'Use letters, numbers, line breaks and basic punctuation',
    taxId: 'Use 8–10 digits',
    iban: 'Use Ukrainian IBAN format: UA + 27 digits',

    paymentPurpose:
      'Payment purpose may contain letters, numbers, spaces and basic punctuation',

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
    emailMax: 'Email must be at most 64 characters',
    phoneMax: 'Phone must be at most 13 characters',
    passwordMin: 'Password must be at least 8 characters',
    passwordMax: 'Password must be at most 20 characters',
    addressMin: 'Address must be at least 10 characters',
    addressMax: 'Address must be at most 200 characters',
    searchMax: 'Search must be at most 80 characters',
    reviewCommentMin: 'Review comment must be at least 10 characters',
    reviewCommentMax: 'Review comment must be at most 500 characters',
    orderCommentMax: 'Order comment must be at most 500 characters',
    workingHoursMax: 'Working hours must be at most 160 characters',
    textEditorMax: 'Text must be at most 5000 characters',
    paymentPurposeMax: 'Payment purpose must be at most 500 characters',
    pictureMax: 'Photo is too large. Use a smaller image',
    picturePayloadMax: 'Photo is too large. Use an image up to 450 KB',
    pictureFileSize: 'Photo must be up to 450 KB',
  },

  object: {
    atLeastOneField: 'At least one field is required',
  },
} as const;
