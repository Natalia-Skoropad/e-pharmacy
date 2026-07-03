//===================================================================

const ABSOLUTE_IMAGE_URL_PATTERN = /^(https?:|data:|blob:)/i;
const LOCAL_API_BASE_URL = 'http://localhost:4000';

//===================================================================

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV !== 'production' ? LOCAL_API_BASE_URL : '')
  ).replace(/\/$/, '');
}

//===================================================================

export function getProductImageSrc(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  if (ABSOLUTE_IMAGE_URL_PATTERN.test(imageUrl)) return imageUrl;

  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl && imageUrl.startsWith('/images/')) {
    return `${apiBaseUrl}${imageUrl}`;
  }

  if (apiBaseUrl && imageUrl.startsWith('images/')) {
    return `${apiBaseUrl}/${imageUrl}`;
  }

  return imageUrl;
}
