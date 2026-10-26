import type { MongoDuplicateKeyError } from '../types/infrastructure/mongo';

//===============================================================

// Driver errors may be plain code-bearing objects, not Error instances.
// Preserve the strict Error guard below for callers that read keyPattern or
// keyValue. Idempotent replay/rate-limit guards historically accepted both.
export function hasMongoDuplicateKeyCode(
  error: unknown
): error is { code: 11000 } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

//===============================================================

export function isMongoDuplicateKeyError(
  error: unknown
): error is MongoDuplicateKeyError {
  return error instanceof Error && hasMongoDuplicateKeyCode(error);
}

//===============================================================

export function isDuplicateEmailError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(error.keyPattern?.email || error.keyValue?.email);
}

//===============================================================

export function isDuplicatePhoneError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(error.keyPattern?.phone || error.keyValue?.phone);
}

//===============================================================

export function isDuplicateProductReviewError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(
    (error.keyPattern?.productId && error.keyPattern?.userId) ||
    (error.keyValue?.productId && error.keyValue?.userId)
  );
}

//===============================================================

export function isDuplicatePharmacyReviewError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(
    (error.keyPattern?.pharmacyId && error.keyPattern?.userId) ||
    (error.keyValue?.pharmacyId && error.keyValue?.userId)
  );
}

//===============================================================

export function isDuplicateProductOfferError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(
    (error.keyPattern?.productId && error.keyPattern?.pharmacyId) ||
    (error.keyValue?.productId && error.keyValue?.pharmacyId)
  );
}

//===============================================================

export function isDuplicateProductRequestArticleError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(error.keyPattern?.article || error.keyValue?.article);
}

//===============================================================

export function isDuplicateProductArticleError(error: unknown): boolean {
  if (!isMongoDuplicateKeyError(error)) return false;

  return Boolean(error.keyPattern?.article || error.keyValue?.article);
}
