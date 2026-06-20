const LOCAL_SITE_URL = 'http://localhost:3000';

//===================================================================

const isProductionDeploy =
  process.env.VERCEL_ENV === 'production' || process.env.CI === 'true';

//===================================================================

function resolveSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) return siteUrl;

  if (isProductionDeploy) {
    throw new Error('NEXT_PUBLIC_SITE_URL is required for production deploys.');
  }

  return LOCAL_SITE_URL;
}

//===================================================================

export const CLIENT_ENV = {
  siteUrl: resolveSiteUrl(),
} as const;
