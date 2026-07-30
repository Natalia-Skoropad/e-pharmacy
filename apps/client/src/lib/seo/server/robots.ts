import 'server-only';

import { createAbsoluteUrl } from './sitemap';

//===================================================================

type RobotsConfig = Readonly<{
  rules: Readonly<{
    userAgent: string;
    allow: string;
    disallow: string[];
  }>;
  sitemap: string;
}>;

//===================================================================

export function createClientRobotsConfig({
  siteUrl,
  disallowRoutes = [],
}: Readonly<{
  siteUrl: string;
  disallowRoutes?: readonly string[];
}>): RobotsConfig {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...disallowRoutes],
    },

    sitemap: createAbsoluteUrl('/sitemap.xml', siteUrl),
  };
}
