import type { MetadataRoute } from 'next';

import { ROBOTS_DISALLOW_ROUTES } from '@/lib/constants/seo';
import { SITE_URL } from '@/lib/constants/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_ROUTES],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
