import { normalizeSlugPart } from './normalize-slug-part';

//===================================================================

export function buildSlugId(name: string, id: string): string {
  const slug = normalizeSlugPart(name);

  return slug ? `${slug}-${id}` : id;
}
