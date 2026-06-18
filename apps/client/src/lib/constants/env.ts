const LOCAL_SITE_URL = 'http://localhost:3000';

//===================================================================

const PRODUCTION_SITE_URL = 'https://e-pharmacy-client-ten.vercel.app';

//===================================================================

const isProduction = process.env.NODE_ENV === 'production';

//===================================================================

export const CLIENT_ENV = {
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (isProduction ? PRODUCTION_SITE_URL : LOCAL_SITE_URL),
} as const;
