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
    picture: 'Photo is required',
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
    reviewRating: 'Choose a rating from 1 to 5 stars',
    orderComment:
      'Order comment may contain only Latin letters, numbers, spaces and basic punctuation',
    picture: 'Photo must be a valid image URL or JPG/PNG/WEBP upload',
    pictureFileType: 'Please choose a JPG, PNG, or WEBP image',
    search: 'Search may contain only allowed text characters',
  },

  limits: {
    nameMin: 'Name must be at least 2 characters',
    nameMax: 'Name must be at most 50 characters',
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
    pictureMax: 'Photo is too large. Use a smaller image',
    picturePayloadMax: 'Photo is too large. Use an image up to 450 KB',
    pictureFileSize: 'Photo must be up to 450 KB',
  },

  object: {
    atLeastOneField: 'At least one field is required',
  },
} as const;
