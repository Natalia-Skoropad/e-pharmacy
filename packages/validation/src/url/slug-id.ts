export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

//===================================================================

export const PUBLIC_ENTITY_SLUG_PREFIXES = {
  product: 'pr',
  pharmacy: 'ph',
} as const;

//===================================================================

export type PublicEntitySlugType = keyof typeof PUBLIC_ENTITY_SLUG_PREFIXES;

//===================================================================

export type ParsedPublicEntitySlugId = Readonly<{
  entityType: PublicEntitySlugType;
  id: string;
}>;

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

//===================================================================

export function buildPublicEntitySlugId(
  entityType: PublicEntitySlugType,
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

//===================================================================

export function parsePublicEntitySlugId(
  slugId: string
): ParsedPublicEntitySlugId | null {
  const match = slugId.match(/(?:^|-)(pr|ph)([a-f\d]{24})$/i);
  if (!match) return null;

  const [, prefix, id] = match;
  if (!prefix || !id) return null;

  const entityType =
    prefix.toLowerCase() === PUBLIC_ENTITY_SLUG_PREFIXES.product
      ? 'product'
      : 'pharmacy';

  return { entityType, id };
}

//===================================================================

export function getProductIdFromPublicSlugId(slugId: string): string | null {
  const parsed = parsePublicEntitySlugId(slugId);
  return parsed?.entityType === 'product' ? parsed.id : null;
}

//===================================================================

export function getPharmacyIdFromPublicSlugId(slugId: string): string | null {
  const parsed = parsePublicEntitySlugId(slugId);
  return parsed?.entityType === 'pharmacy' ? parsed.id : null;
}

//===================================================================

export function getIdFromSlugId(slugId: string): string | null {
  const id = slugId.split('-').at(-1);

  if (!id || !OBJECT_ID_PATTERN.test(id)) return null;

  return id;
}

//===================================================================

export function isValidObjectId(value?: string): value is string {
  return Boolean(value && OBJECT_ID_PATTERN.test(value));
}
