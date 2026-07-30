import type { MetadataRoute } from 'next';

import { getClientSiteUrl } from '@/lib/constants/env';
import { buildClientSitemap } from '@/lib/seo/server';

//===================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const report = await buildClientSitemap({
    siteUrl: getClientSiteUrl(),
  });

  return report.routes as MetadataRoute.Sitemap;
}
