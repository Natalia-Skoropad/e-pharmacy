export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

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

export function getIdFromSlugId(slugId: string): string | null {
  const id = slugId.split('-').at(-1);

  if (!id || !OBJECT_ID_PATTERN.test(id)) return null;

  return id;
}

//===================================================================

export function isValidObjectId(value?: string): value is string {
  return Boolean(value && OBJECT_ID_PATTERN.test(value));
}
