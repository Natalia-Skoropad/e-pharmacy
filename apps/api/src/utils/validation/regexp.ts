export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

//===============================================================

export function createSafeRegExp(value: string, flags = 'i'): RegExp {
  return new RegExp(escapeRegExp(value), flags);
}

//===============================================================

export function createFlexibleSearchRegExp(
  value: string,
  flags = 'i'
): RegExp {
  const tokens = value
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .filter(Boolean);

  return tokens.length
    ? new RegExp(tokens.join('[\\s\\W_]*'), flags)
    : createSafeRegExp(value, flags);
}
