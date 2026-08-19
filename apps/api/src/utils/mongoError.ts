import type { MongoDuplicateKeyError } from '../types/mongo';

//===============================================================

export function isMongoDuplicateKeyError(
  error: unknown
): error is MongoDuplicateKeyError {
  return error instanceof Error && 'code' in error && error.code === 11000;
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
