import { isIP } from 'node:net';
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

const SAFE_HEADER_VALUE_PATTERN = /^[ -~]+$/;
const TRACEPARENT_PATTERN = /^(?!ff)[\da-f]{2}-(?!0{32})[\da-f]{32}-(?!0{16})[\da-f]{16}-[\da-f]{2}$/i;
const TRACESTATE_PATTERN = /^[a-z0-9_\-*/@=,.; ]+$/i;

//===================================================================

function getSafeHeaderValue(
  value: string | null,
  maximumLength = 512
): string | undefined {
  const normalized = value?.trim();
  return normalized &&
    normalized.length <= maximumLength &&
    SAFE_HEADER_VALUE_PATTERN.test(normalized)
    ? normalized
    : undefined;
}

//===================================================================

function getSafeHttpUrlHeader(
  value: string | null,
  originOnly: boolean
): string | undefined {
  const normalized = getSafeHeaderValue(value, 2048);
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    if (url.username || url.password) return undefined;
    return originOnly ? url.origin : url.toString();
  } catch {
    return undefined;
  }
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

  for (const candidate of candidates) {
    const first = candidate?.split(',')[0]?.trim();
    if (first && isIP(first)) return first;
  }

  return undefined;
}

//===================================================================

function getTraceparent(value: string | null): string | undefined {
  const normalized = getSafeHeaderValue(value, 55);
  return normalized && TRACEPARENT_PATTERN.test(normalized)
    ? normalized.toLowerCase()
    : undefined;
}

//===================================================================

function getTracestate(value: string | null): string | undefined {
  const normalized = getSafeHeaderValue(value, 512);
  return normalized && TRACESTATE_PATTERN.test(normalized)
    ? normalized
    : undefined;
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
  const origin = getSafeHttpUrlHeader(request.headers.get('origin'), true);
  const referer = getSafeHttpUrlHeader(request.headers.get('referer'), false);
  const userAgent = getSafeHeaderValue(request.headers.get('user-agent'), 500);
  const deviceName = getSafeHeaderValue(
    request.headers.get(DEVICE_NAME_HEADER_NAME),
    120
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

  const traceparent = getTraceparent(request.headers.get('traceparent'));
  const tracestate = getTracestate(request.headers.get('tracestate'));
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
