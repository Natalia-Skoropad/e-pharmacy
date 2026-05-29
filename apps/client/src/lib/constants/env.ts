const LOCAL_SITE_URL = 'http://localhost:3000';
const LOCAL_API_BASE_URL = 'http://localhost:4000';

//===================================================================

const PRODUCTION_SITE_URL = 'https://e-pharmacy-client-ten.vercel.app';
const PRODUCTION_API_BASE_URL = 'https://e-pharmacy-api-pbaz.onrender.com';

//===================================================================

const isProduction = process.env.NODE_ENV === 'production';

//===================================================================

export const CLIENT_ENV = {
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (isProduction ? PRODUCTION_SITE_URL : LOCAL_SITE_URL),
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (isProduction ? PRODUCTION_API_BASE_URL : LOCAL_API_BASE_URL),
} as const;
