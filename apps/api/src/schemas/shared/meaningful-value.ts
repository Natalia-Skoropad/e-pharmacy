export function hasMeaningfulValue(value: unknown): boolean {
  if (value === null) return true;
  if (value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return true;

  if (typeof value === 'object') {
    return Object.values(value).some(hasMeaningfulValue);
  }

  return true;
}
