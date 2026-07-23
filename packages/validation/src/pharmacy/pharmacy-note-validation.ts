export const PHARMACY_NOTE_MAX_LENGTH = 1000;

//===================================================================

export function buildPharmacyNoteError(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) return 'Comment is required';
  if (normalizedValue.length > PHARMACY_NOTE_MAX_LENGTH) {
    return `Comment must be at most ${PHARMACY_NOTE_MAX_LENGTH} characters`;
  }

  return '';
}
