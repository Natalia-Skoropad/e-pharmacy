import type { MetadataRoute } from 'next';

import { createClientRobotsConfig, ROBOTS_DISALLOW_ROUTES } from '@/lib/seo/server';

import { getClientCanonicalSiteUrl } from '@/lib/constants/env';

//===================================================================

export default function robots(): MetadataRoute.Robots {
  return createClientRobotsConfig({
    siteUrl: getClientCanonicalSiteUrl(),
    disallowRoutes: ROBOTS_DISALLOW_ROUTES,
  }) as MetadataRoute.Robots;
}
