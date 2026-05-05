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
