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
  avatarUrlMax: 2048,
} as const;

//===================================================================

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
export const PHONE_PATTERN = /^\+380\d{9}$/;
export const ADDRESS_PATTERN = /^[A-Za-z0-9\s.,'’/#-]+$/;
export const REVIEW_COMMENT_PATTERN = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/;

//===================================================================

export function isDataUrl(value: string): boolean {
  return value.trim().toLowerCase().startsWith('data:');
}
