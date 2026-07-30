import type { MetadataRoute } from 'next';

import { createClientRobotsConfig, ROBOTS_DISALLOW_ROUTES } from '@/lib/seo/server';

import { CLIENT_ENV } from '@/lib/constants/env';

//===================================================================

export default function robots(): MetadataRoute.Robots {
  return createClientRobotsConfig({
    siteUrl: CLIENT_ENV.siteUrl,
    disallowRoutes: ROBOTS_DISALLOW_ROUTES,
  }) as MetadataRoute.Robots;
}
