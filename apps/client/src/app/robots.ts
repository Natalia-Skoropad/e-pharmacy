import type { MetadataRoute } from 'next';

import { createRobotsConfig } from '@e-pharmacy/config/seo';

import { ROBOTS_DISALLOW_ROUTES } from '@e-pharmacy/config/seo';
import { CLIENT_ENV } from '@/lib/constants/env';

//===================================================================

export default function robots(): MetadataRoute.Robots {
  return createRobotsConfig({
    app: 'client',
    siteUrl: CLIENT_ENV.siteUrl,
    disallowRoutes: ROBOTS_DISALLOW_ROUTES,
  }) as MetadataRoute.Robots;
}
