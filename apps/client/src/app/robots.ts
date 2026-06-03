import type { MetadataRoute } from 'next';

import { createRobotsConfig } from '@e-pharmacy/config/seo';

import { ROBOTS_DISALLOW_ROUTES } from '@/lib/constants/seo';
import { SITE_URL } from '@/lib/constants/metadata';

//===================================================================

export default function robots(): MetadataRoute.Robots {
  return createRobotsConfig({
    app: 'client',
    siteUrl: SITE_URL,
    disallowRoutes: ROBOTS_DISALLOW_ROUTES,
  }) as MetadataRoute.Robots;
}
