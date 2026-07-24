import { REQUEST_ID_HEADER_NAME } from './bff-contract';

//===================================================================

const FORWARDED_RESPONSE_HEADERS = [
  'content-type',
  'retry-after',
  'www-authenticate',
  'etag',
  'last-modified',
  'vary',
  'content-disposition',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'deprecation',
  'sunset',
  'link',
  'traceparent',
  'tracestate',
] as const;

//===================================================================

function getSafeRelativeLocation(value: string | null): string | undefined {
  const location = value?.trim();
  if (!location || !location.startsWith('/') || location.startsWith('//')) {
    return undefined;
  }

  if (/[\u0000-\u001f\u007f\\]/.test(location)) return undefined;

  try {
    const decodedPath = decodeURIComponent(location.split(/[?#]/, 1)[0] ?? '');
    if (/(?:^|\/)\.{1,2}(?:\/|$)/.test(decodedPath)) return undefined;
  } catch {
    return undefined;
  }

  return location;
}

//===================================================================

export function createProxyResponseHeaders(
  source: Headers,
  cacheControl: string,
  requestId: string
): Headers {
  const headers = new Headers();

  FORWARDED_RESPONSE_HEADERS.forEach((name) => {
    const value = source.get(name);
    if (value) headers.set(name, value);
  });

  const location = getSafeRelativeLocation(source.get('location'));
  if (location) headers.set('Location', location);

  headers.set('Cache-Control', cacheControl);
  headers.set(REQUEST_ID_HEADER_NAME, requestId);

  return headers;
}
