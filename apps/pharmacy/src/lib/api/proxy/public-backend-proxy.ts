import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import { createBackendApiUrl } from '@/lib/api/server/backend-api-request';

import { createProxyHeaders } from './proxy-headers';
import { createProxyResponse } from './proxy-response';

//===================================================================

const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 120;
const STALE_WHILE_REVALIDATE_SECONDS = 300;
const PUBLIC_GET_TIMEOUT_MS = 6_000;
const PUBLIC_RETRY_DELAY_MS = 150;
const PUBLIC_RETRYABLE_STATUSES = new Set([502, 503, 504]);
const NO_STORE_CACHE_CONTROL = 'no-store';

//===================================================================

type PublicBackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  revalidate?: number;
};

//===================================================================

function appendSearchParams(path: string, search: string): string {
  return search
    ? `${path}${search.startsWith('?') ? search : `?${search}`}`
    : path;
}

//===================================================================

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//===================================================================

function createPublicSuccessCacheControl(revalidate: number): string {
  return `public, s-maxage=${revalidate}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;
}

//===================================================================

async function fetchPublicBackend(url: string, request: NextRequest) {
  let response: Response;

  for (let attempt = 1; ; attempt += 1) {
    response = await fetch(url, {
      method: 'GET',
      headers: createProxyHeaders(request, {
        forwardAccept: true,
        forwardContentType: false,
        forwardCookie: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(PUBLIC_GET_TIMEOUT_MS),
    });

    if (attempt >= 2 || !PUBLIC_RETRYABLE_STATUSES.has(response.status)) {
      break;
    }

    await wait(PUBLIC_RETRY_DELAY_MS);
  }

  return response;
}

//===================================================================

export async function proxyPublicBackendRequest({
  backendPath,
  request,
  revalidate = DEFAULT_PUBLIC_REVALIDATE_SECONDS,
}: PublicBackendProxyOptions) {
  const pathWithSearch = appendSearchParams(
    backendPath,
    request.nextUrl.search
  );

  let response: Response;

  try {
    response = await fetchPublicBackend(
      createBackendApiUrl(pathWithSearch),
      request
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'The service is temporarily unavailable.',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': NO_STORE_CACHE_CONTROL,
        },
      }
    );
  }

  return createProxyResponse(response, {
    cacheControl: response.ok
      ? createPublicSuccessCacheControl(revalidate)
      : NO_STORE_CACHE_CONTROL,
    copySetCookie: false,
  });
}
