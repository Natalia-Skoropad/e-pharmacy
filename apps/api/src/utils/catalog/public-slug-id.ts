const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const PUBLIC_ENTITY_SLUG_PREFIXES = {
  product: 'pr',
  pharmacy: 'ph',
} as const;

//===============================================================

function normalizeSlugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/giu, '-')
    .replace(/^-+|-+$/g, '');
}

//===============================================================

export function buildPublicEntitySlugId(
  entityType: keyof typeof PUBLIC_ENTITY_SLUG_PREFIXES,
  name: string,
  id: string
): string {
  if (!OBJECT_ID_PATTERN.test(id)) {
    throw new TypeError('Public entity route requires a valid entity ID.');
  }

  const slug = normalizeSlugPart(name);
  const typedId = `${PUBLIC_ENTITY_SLUG_PREFIXES[entityType]}${id}`;

  return slug ? `${slug}-${typedId}` : typedId;
}
