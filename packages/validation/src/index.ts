export const VALIDATION_LIMITS = {
  nameMin: 2,
  nameMax: 20,
  emailMax: 64,
  passwordMin: 8,
  passwordMax: 20,
  phoneMin: 13,
  phoneMax: 13,
  addressMin: 10,
  addressMax: 200,
  searchMax: 80,
  reviewCommentMin: 10,
  reviewCommentMax: 500,
  orderCommentMax: 500,
  avatarUrlMax: 700000,
} as const;

//===================================================================

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
export const PHONE_PATTERN = /^\+380\d{9}$/;
export const ADDRESS_PATTERN = /^[A-Za-z0-9\s.,'’/#-]+$/;
export const REVIEW_COMMENT_PATTERN = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/;
export const AVATAR_DATA_URL_PATTERN =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;

//===================================================================

export function isDataUrl(value: string): boolean {
  return value.trim().toLowerCase().startsWith('data:');
}

export function isAvatarDataUrl(value: string): boolean {
  return AVATAR_DATA_URL_PATTERN.test(value.trim());
}

//===================================================================

export function sanitizeEmail(value: string): string {
  return value.trimStart().replace(/\s/g, '').slice(0, VALIDATION_LIMITS.emailMax);
}

export function sanitizeName(value: string): string {
  return value
    .replace(/[^A-Za-z '-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, VALIDATION_LIMITS.nameMax);
}

export function sanitizePhone(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '').slice(0, 12);

  if (hasPlus || digits.startsWith('380')) {
    return `+${digits}`.slice(0, VALIDATION_LIMITS.phoneMax);
  }

  return digits.slice(0, VALIDATION_LIMITS.phoneMax);
}

export function sanitizeAddress(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\s.,'’/#-]/g, '')
    .slice(0, VALIDATION_LIMITS.addressMax);
}

//===================================================================

type TextFieldErrorOptions = {
  required?: boolean;
  trailingDot?: boolean;
};

function withTrailingDot(message: string, trailingDot?: boolean): string {
  return trailingDot ? `${message}.` : message;
}

export function buildEmailError(value: string): string {
  const email = value.trim();

  if (!email) return 'Email is required';

  if (email.length > VALIDATION_LIMITS.emailMax) {
    return `Email must be at most ${VALIDATION_LIMITS.emailMax} characters`;
  }

  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address';

  return '';
}

export function buildPasswordError(value: string): string {
  if (!value) return 'Password is required';

  if (value.length < VALIDATION_LIMITS.passwordMin) {
    return `Password must be at least ${VALIDATION_LIMITS.passwordMin} characters`;
  }

  if (value.length > VALIDATION_LIMITS.passwordMax) {
    return `Password must be at most ${VALIDATION_LIMITS.passwordMax} characters`;
  }

  return '';
}

export function buildNameError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? 'Name is required' : '';

  if (name.length < VALIDATION_LIMITS.nameMin) {
    return withTrailingDot(
      `Name must be at least ${VALIDATION_LIMITS.nameMin} characters`,
      options.trailingDot
    );
  }

  if (name.length > VALIDATION_LIMITS.nameMax) {
    return withTrailingDot(
      `Name must be at most ${VALIDATION_LIMITS.nameMax} characters`,
      options.trailingDot
    );
  }

  if (!NAME_PATTERN.test(name)) {
    return withTrailingDot(
      'Use only Latin letters, spaces, apostrophe or hyphen',
      options.trailingDot
    );
  }

  return '';
}

export function buildPhoneError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const phone = value.trim();

  if (!phone) return options.required ? 'Phone is required' : '';

  if (!PHONE_PATTERN.test(phone)) {
    return withTrailingDot('Enter phone in format +380XXXXXXXXX', options.trailingDot);
  }

  return '';
}

export function buildAddressError(
  value: string,
  options: TextFieldErrorOptions = {}
): string {
  const address = value.trim();

  if (!address) return options.required ? 'Address is required' : '';

  if (address.length < VALIDATION_LIMITS.addressMin) {
    return withTrailingDot(
      `Address must be at least ${VALIDATION_LIMITS.addressMin} characters`,
      options.trailingDot
    );
  }

  if (address.length > VALIDATION_LIMITS.addressMax) {
    return withTrailingDot(
      `Address must be at most ${VALIDATION_LIMITS.addressMax} characters`,
      options.trailingDot
    );
  }

  if (!ADDRESS_PATTERN.test(address)) {
    return withTrailingDot(
      'Use Latin letters, numbers, spaces, comma, dot, slash, apostrophe, # or hyphen',
      options.trailingDot
    );
  }

  return '';
}
