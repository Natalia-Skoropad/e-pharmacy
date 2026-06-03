export type RobotsApp = 'client' | 'vendor' | 'admin';

export type RobotsConfig = {
  rules: {
    userAgent: string;
    allow?: string | string[];
    disallow?: string | string[];
  };
  sitemap?: string;
};

//===================================================================

type CreateRobotsConfigParams = {
  app: RobotsApp;
  siteUrl: string;
  disallowRoutes?: readonly string[];
};

//===================================================================

export function createRobotsConfig({
  app,
  siteUrl,
  disallowRoutes = [],
}: CreateRobotsConfigParams): RobotsConfig {
  if (app === 'vendor' || app === 'admin') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...disallowRoutes],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
