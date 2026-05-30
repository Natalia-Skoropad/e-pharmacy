import { VALIDATION_LIMITS } from './limits';

//=============================================================================

export const VALIDATION_MESSAGES = {
  required: {
    email: 'Email is required',
    password: 'Password is required',
    name: 'Name is required',
    phone: 'Phone is required',
    address: 'Address is required',
    currentPassword: 'Current password is required',
    confirmPassword: 'Confirm password is required',
    resetToken: 'Reset token is required',
  },

  format: {
    email: 'Enter a valid email address',
    emailApi: 'Email must be valid',
    phone: 'Enter phone in format +380XXXXXXXXX',
    name: 'Use only Latin letters, spaces, apostrophe or hyphen',
    address:
      'Use Latin letters, numbers, spaces, comma, dot, slash, apostrophe, # or hyphen',
    avatar: 'Avatar must be a valid image URL or JPG/PNG/WEBP upload',
    passwordMatch: 'Passwords do not match',
  },

  limits: {
    nameMin: `Name must be at least ${VALIDATION_LIMITS.nameMin} characters`,
    nameMax: `Name must be at most ${VALIDATION_LIMITS.nameMax} characters`,
    emailMax: `Email must be at most ${VALIDATION_LIMITS.emailMax} characters`,
    passwordMin: `Password must be at least ${VALIDATION_LIMITS.passwordMin} characters`,
    passwordMax: `Password must be at most ${VALIDATION_LIMITS.passwordMax} characters`,
    phoneMax: `Phone must be at most ${VALIDATION_LIMITS.phoneMax} characters`,
    avatarMax: `Avatar image must be at most ${VALIDATION_LIMITS.avatarUrlMax} characters`,
  },

  object: {
    atLeastOneField: 'At least one field is required',
  },
} as const;
