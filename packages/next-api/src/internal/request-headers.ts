import type { NextRequest } from 'next/server';

import {
  BFF_AUTH_PROXY_HEADER_NAME,
  BFF_AUTH_PROXY_MARKER_VALUE,
  BFF_PROXY_SECRET_HEADER_NAME,
  DEVICE_NAME_HEADER_NAME,
  REQUEST_ID_HEADER_NAME,
} from './bff-contract';

import {
  createAllowedAuthCookieHeader,
  type AuthCookieForwardMode,
} from './cookie-header';

import { getNextApiServerEnvironment } from './env';

//===================================================================

type ProxyHeadersOptions = Readonly<{
  authCookieMode: AuthCookieForwardMode;
  requestId: string;
  forwardAccept?: boolean;
  forwardContentType?: boolean;
  includeAuthProxyMarker?: boolean;
}>;

//===================================================================

const SAFE_HEADER_VALUE_PATTERN = /^[\u0020-\u007e]{1,512}$/;
const IP_VALUE_PATTERN = /^[a-f\d:.,\s]{1,256}$/i;

//===================================================================

function getSafeHeaderValue(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized && SAFE_HEADER_VALUE_PATTERN.test(normalized)
    ? normalized
    : undefined;
}

//===================================================================

function getTrustedClientIp(request: NextRequest): string | undefined {
  const candidates = [
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('cf-connecting-ip'),
    process.env.NODE_ENV !== 'production'
      ? request.headers.get('x-real-ip')
      : null,
  ];

  const value = candidates.find((candidate) => candidate?.trim())?.trim();
  return value && IP_VALUE_PATTERN.test(value) ? value : undefined;
}

//===================================================================

export function createProxyRequestHeaders(
  request: NextRequest,
  {
    authCookieMode,
    requestId,
    forwardAccept = false,
    forwardContentType = true,
    includeAuthProxyMarker = false,
  }: ProxyHeadersOptions
): Headers {
  const headers = new Headers();
  const accept = getSafeHeaderValue(request.headers.get('accept'));
  const contentType = getSafeHeaderValue(request.headers.get('content-type'));
  const origin = getSafeHeaderValue(request.headers.get('origin'));
  const referer = getSafeHeaderValue(request.headers.get('referer'));
  const userAgent = getSafeHeaderValue(request.headers.get('user-agent'));
  const deviceName = getSafeHeaderValue(
    request.headers.get(DEVICE_NAME_HEADER_NAME)
  );
  const clientIp = getTrustedClientIp(request);
  const cookie = createAllowedAuthCookieHeader(
    request.headers.get('cookie'),
    authCookieMode
  );

  if (forwardAccept && accept) headers.set('Accept', accept);
  if (forwardContentType && contentType)
    headers.set('Content-Type', contentType);
  if (cookie) headers.set('Cookie', cookie);
  if (origin) headers.set('Origin', origin);
  if (referer) headers.set('Referer', referer);
  if (userAgent) headers.set('User-Agent', userAgent);
  if (deviceName) headers.set(DEVICE_NAME_HEADER_NAME, deviceName);
  if (clientIp) headers.set('X-Forwarded-For', clientIp);

  headers.set(REQUEST_ID_HEADER_NAME, requestId);

  const traceparent = getSafeHeaderValue(request.headers.get('traceparent'));
  const tracestate = getSafeHeaderValue(request.headers.get('tracestate'));
  if (traceparent) headers.set('traceparent', traceparent);
  if (tracestate) headers.set('tracestate', tracestate);

  if (includeAuthProxyMarker) {
    headers.set(BFF_AUTH_PROXY_HEADER_NAME, BFF_AUTH_PROXY_MARKER_VALUE);

    const { bffProxySecret } = getNextApiServerEnvironment();
    if (bffProxySecret) {
      headers.set(BFF_PROXY_SECRET_HEADER_NAME, bffProxySecret);
    }
  }

  return headers;
}
