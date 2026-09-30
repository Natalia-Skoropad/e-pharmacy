export const REFERENCE_DATA_NAME_MAX_LENGTH = 100;

/** ASCII Latin letters and spaces only, with an uppercase first character. */
export const REFERENCE_DATA_NAME_PATTERN = /^[A-Z][A-Za-z ]*$/;

//===================================================================

export const REFERENCE_DATA_NAME_MESSAGES = {
  required: 'Name is required',
  maxLength: `Name must be at most ${REFERENCE_DATA_NAME_MAX_LENGTH} characters`,
  format: 'Use Latin letters and spaces, starting with an uppercase letter',
} as const;

//===================================================================

/** Value persisted as the human-readable category/position name. */
export function normalizeReferenceDataName(value: string): string {
  return value.trim();
}

//===================================================================

/**
 * Stable comparison key for case-insensitive uniqueness checks.
 * Internal whitespace is compacted here so visually equivalent names collide.
 */
export function normalizeReferenceDataNameKey(value: string): string {
  return normalizeReferenceDataName(value).replace(/\s+/g, ' ').toLowerCase();
}

//===================================================================

export function buildReferenceDataNameError(value: string): string {
  const name = normalizeReferenceDataName(value);

  if (!name) return REFERENCE_DATA_NAME_MESSAGES.required;

  if (name.length > REFERENCE_DATA_NAME_MAX_LENGTH) {
    return REFERENCE_DATA_NAME_MESSAGES.maxLength;
  }

  if (!REFERENCE_DATA_NAME_PATTERN.test(name)) {
    return REFERENCE_DATA_NAME_MESSAGES.format;
  }

  return '';
}

//===================================================================

export function isReferenceDataNameValid(value: string): boolean {
  return buildReferenceDataNameError(value) === '';
}
