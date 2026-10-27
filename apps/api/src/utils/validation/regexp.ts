export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

//===============================================================

export function createSafeRegExp(value: string, flags = 'i'): RegExp {
  return new RegExp(escapeRegExp(value), flags);
}

//===============================================================

export function createFlexibleSearchRegExp(value: string, flags = 'i'): RegExp {
  const tokens = value.trim().split(/\s+/).map(escapeRegExp).filter(Boolean);

  return tokens.length
    ? new RegExp(tokens.join('[\\s\\W_]*'), flags)
    : createSafeRegExp(value, flags);
}

//===============================================================

// Public location slugs replace separators with spaces. Match the canonical
// stored settlement/region without broadening a location to a substring match.
// Unicode separators include hyphens, apostrophes, and localized punctuation.
export function createCanonicalLocationRegExp(value: string): RegExp {
  const parts = value
    .normalize('NFKC')
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map(escapeRegExp);

  if (parts.length === 0) return /^$/;

  return new RegExp(`^\\s*${parts.join('[^\\p{L}\\p{N}]*')}\\s*$`, 'iu');
}
