import type { MetadataRoute } from 'next';

import { SITEMAP_STATIC_ROUTES } from '@/lib/constants/seo';
import { createAbsoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return SITEMAP_STATIC_ROUTES.map((route) => ({
    url: createAbsoluteUrl(route),
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'daily',
    priority: route === '/' ? 1 : 0.8,
  }));
}
