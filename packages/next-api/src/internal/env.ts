// This module is internal to the server-only proxy/server entrypoints.

//===================================================================

type NodeEnvironment = 'development' | 'test' | 'production';
type CookieSameSite = 'lax' | 'strict' | 'none';
type TrustedProxyProvider = 'none' | 'vercel' | 'cloudflare';

//===================================================================

export type NextApiServerEnvironment = Readonly<{
  nodeEnv: NodeEnvironment;
  apiBaseUrl: string;
  bffProxySecret?: string;
  authCookieDomain?: string;
  authCookieLegacyDomains: readonly string[];
  authCookieSameSite: CookieSameSite;
  trustedProxyProvider: TrustedProxyProvider;
}>;

//===================================================================

const LOCAL_API_BASE_URL = 'http://localhost:4000';
const COOKIE_DOMAIN_PATTERN = /^\.?[a-z\d](?:[a-z\d.-]*[a-z\d])?$/i;

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

function parseCookieDomain(value: string, variableName: string): string {
  const domain = value.trim().toLowerCase();

  if (!domain || !COOKIE_DOMAIN_PATTERN.test(domain)) {
    throw new Error(`${variableName} contains an invalid cookie domain.`);
  }

  return domain;
}

//===================================================================

function getCookieDomain(): string | undefined {
  const value = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return value ? parseCookieDomain(value, 'AUTH_COOKIE_DOMAIN') : undefined;
}

//===================================================================

function getLegacyCookieDomains(currentDomain?: string): readonly string[] {
  const domains = (process.env.AUTH_COOKIE_LEGACY_DOMAINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => parseCookieDomain(value, 'AUTH_COOKIE_LEGACY_DOMAINS'));

  return Array.from(new Set(domains)).filter(
    (domain) => domain !== currentDomain
  );
}

//===================================================================

function getTrustedProxyProvider(): TrustedProxyProvider {
  const value =
    process.env.BFF_TRUSTED_PROXY_PROVIDER?.trim().toLowerCase() || 'none';

  if (value === 'none' || value === 'vercel' || value === 'cloudflare') {
    return value;
  }

  throw new Error(
    'BFF_TRUSTED_PROXY_PROVIDER must be none, vercel, or cloudflare.'
  );
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
  const authCookieDomain = getCookieDomain();

  if (nodeEnv === 'production' && !bffProxySecret) {
    throw new Error('BFF_PROXY_SECRET is required in production.');
  }

  return {
    nodeEnv,
    apiBaseUrl: getApiBaseUrl(nodeEnv),
    bffProxySecret,
    authCookieDomain,
    authCookieLegacyDomains: getLegacyCookieDomains(authCookieDomain),
    authCookieSameSite: getCookieSameSite(),
    trustedProxyProvider: getTrustedProxyProvider(),
  };
}
