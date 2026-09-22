// This module is internal to the server-only proxy/server entrypoints.

import {
  resolveApiBaseUrl,
  resolveNodeEnvironment,
  type NodeEnvironment,
} from '../contracts/api-base-url';

//===================================================================

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

const COOKIE_DOMAIN_PATTERN = /^\.?[a-z\d](?:[a-z\d.-]*[a-z\d])?$/i;

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

export function getNextApiServerEnvironment(): NextApiServerEnvironment {
  const nodeEnv = resolveNodeEnvironment(process.env.NODE_ENV);
  const bffProxySecret = process.env.BFF_PROXY_SECRET?.trim() || undefined;
  const authCookieDomain = getCookieDomain();

  if (!bffProxySecret) {
    throw new Error('BFF_PROXY_SECRET is required for trusted auth proxying.');
  }

  return {
    nodeEnv,
    apiBaseUrl: resolveApiBaseUrl(process.env.API_BASE_URL, nodeEnv),
    bffProxySecret,
    authCookieDomain,
    authCookieLegacyDomains: getLegacyCookieDomains(authCookieDomain),
    authCookieSameSite: getCookieSameSite(),
    trustedProxyProvider: getTrustedProxyProvider(),
  };
}
