const ABSOLUTE_IMAGE_URL_PATTERN = /^(https?:|data:|blob:)/i;
const DEVELOPMENT_API_BASE_URL = 'http://localhost:4000';

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

export function getProductImageSrc(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
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
