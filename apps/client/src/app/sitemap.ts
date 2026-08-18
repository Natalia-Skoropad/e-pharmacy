import type { MetadataRoute } from 'next';

import { getClientCanonicalSiteUrl } from '@/lib/constants/env';

import {
  INFO_DOCUMENTS,
  isInfoDocumentApproved,
} from '@/components/info/config';

import { buildClientSitemap } from '@/lib/seo/server';

//===================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const report = await buildClientSitemap({
    siteUrl: getClientCanonicalSiteUrl(),

    approvedInfoPaths: INFO_DOCUMENTS.filter(isInfoDocumentApproved).map(
      (document) => document.path
    ),
  });

  return report.routes as MetadataRoute.Sitemap;
}
