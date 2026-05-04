export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

//===================================================================

export function normalizeSlugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/giu, '-')
    .replace(/^-+|-+$/g, '');
}

//===================================================================

export function buildSlugId(name: string, id: string): string {
  const slug = normalizeSlugPart(name);

  return slug ? `${slug}-${id}` : id;
}
