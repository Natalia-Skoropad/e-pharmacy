export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

//===============================================================

export function createSafeRegExp(value: string, flags = 'i'): RegExp {
  return new RegExp(escapeRegExp(value), flags);
}
