import { buildSlugId } from './slug-id';

//===================================================================

// Store details intentionally use root-level SEO URLs. Keep reserved root
// slugs protected in root-detail-resolver when adding new public pages.

export function buildStorePath(name: string, id: string): string {
  return `/${buildSlugId(name, id)}`;
}
