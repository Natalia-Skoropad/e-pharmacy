type RobotsConfig = {
  rules: {
    userAgent: string;
    allow: string;
    disallow: string[];
  };
  sitemap: string;
};

//===================================================================

type CreateClientRobotsConfigParams = {
  siteUrl: string;
  disallowRoutes?: readonly string[];
};

//===================================================================

export function createClientRobotsConfig({
  siteUrl,
  disallowRoutes = [],
}: CreateClientRobotsConfigParams): RobotsConfig {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...disallowRoutes],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
