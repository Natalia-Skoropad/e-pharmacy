export const VALIDATION_LIMITS = {
  nameMin: 2,
  nameMax: 64,
  emailMax: 128,
  passwordMin: 8,
  passwordMax: 64,
  searchMax: 80,
} as const;

//===================================================================

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
