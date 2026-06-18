import { buildSlugId } from './slug-id';

//===================================================================

// Public pharmacy details intentionally use root-level SEO URLs.
export function buildPharmacyPath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}
