import 'server-only';

//===================================================================

type NodeEnvironment = 'development' | 'test' | 'production';
type CookieSameSite = 'lax' | 'strict' | 'none';

//===================================================================

export type NextApiServerEnvironment = Readonly<{
  nodeEnv: NodeEnvironment;
  apiBaseUrl: string;
  bffProxySecret?: string;
  authCookieDomain?: string;
  authCookieSameSite: CookieSameSite;
}>;

//===================================================================

const LOCAL_API_BASE_URL = 'http://localhost:4000';

//===================================================================

function getNodeEnvironment(): NodeEnvironment {
  const value = process.env.NODE_ENV ?? 'development';

  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  throw new Error('NODE_ENV must be development, test, or production.');
}

//===================================================================

function getCookieSameSite(): CookieSameSite {
  const value =
    process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase() || 'lax';

  if (value === 'lax' || value === 'strict' || value === 'none') return value;

  throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none.');
}

//===================================================================

function getApiBaseUrl(nodeEnv: NodeEnvironment): string {
  const configured = process.env.API_BASE_URL?.trim();
  const value =
    configured || (nodeEnv === 'production' ? '' : LOCAL_API_BASE_URL);

  if (!value) {
    throw new Error('API_BASE_URL is required in production.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('API_BASE_URL must be a valid absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('API_BASE_URL must use http or https.');
  }

  if (nodeEnv === 'production' && url.protocol !== 'https:') {
    throw new Error('API_BASE_URL must use https in production.');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      'API_BASE_URL must not contain credentials, query, or hash.'
    );
  }

  return url.toString();
}

//===================================================================

export function getNextApiServerEnvironment(): NextApiServerEnvironment {
  const nodeEnv = getNodeEnvironment();
  const bffProxySecret = process.env.BFF_PROXY_SECRET?.trim() || undefined;

  if (nodeEnv === 'production' && !bffProxySecret) {
    throw new Error('BFF_PROXY_SECRET is required in production.');
  }

  return {
    nodeEnv,
    apiBaseUrl: getApiBaseUrl(nodeEnv),
    bffProxySecret,
    authCookieDomain: process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined,
    authCookieSameSite: getCookieSameSite(),
  };
}
