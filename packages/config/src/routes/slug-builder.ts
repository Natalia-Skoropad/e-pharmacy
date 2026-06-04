function normalizeSlugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/giu, '-')
    .replace(/^-+|-+$/g, '');
}

//===================================================================

export function buildRouteSlugId(name: string, id: string): string {
  const slug = normalizeSlugPart(name);

  return slug ? `${slug}-${id}` : id;
}
