const ABSOLUTE_IMAGE_URL_PATTERN = /^(https?:|data:|blob:)/i;
const DEVELOPMENT_API_BASE_URL = 'http://localhost:4000';

const SAME_ORIGIN_SEED_IMAGE_PREFIXES = [
  '/images/seed/products/',
  '/images/seed/clients/',
] as const;

//===================================================================

function getValidatedApiBaseUrl(): string | undefined {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const candidate =
    configuredUrl || (isProduction ? undefined : DEVELOPMENT_API_BASE_URL);

  if (!candidate) return undefined;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  if (isProduction && url.protocol !== 'https:') return undefined;
  if (url.username || url.password || url.search || url.hash) return undefined;

  return `${url.origin}${url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '')}`;
}

//===================================================================

function getSameOriginSeedImagePath(imageUrl: string): string | undefined {
  const normalized = imageUrl.startsWith('images/') ? `/${imageUrl}` : imageUrl;

  if (
    SAME_ORIGIN_SEED_IMAGE_PREFIXES.some((prefix) =>
      normalized.startsWith(prefix)
    )
  ) {
    return normalized;
  }

  if (!/^https?:/i.test(imageUrl)) return undefined;

  try {
    const url = new URL(imageUrl);
    if (
      !SAME_ORIGIN_SEED_IMAGE_PREFIXES.some((prefix) =>
        url.pathname.startsWith(prefix)
      )
    ) {
      return undefined;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

//===================================================================

export function getProductImageSrc(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;

  const sameOriginSeedImagePath = getSameOriginSeedImagePath(imageUrl);
  if (sameOriginSeedImagePath) return sameOriginSeedImagePath;

  if (ABSOLUTE_IMAGE_URL_PATTERN.test(imageUrl)) return imageUrl;

  if (imageUrl.startsWith('/images/') || imageUrl.startsWith('images/')) {
    const apiBaseUrl = getValidatedApiBaseUrl();
    if (!apiBaseUrl) return undefined;

    return imageUrl.startsWith('/')
      ? `${apiBaseUrl}${imageUrl}`
      : `${apiBaseUrl}/${imageUrl}`;
  }

  return imageUrl;
}
