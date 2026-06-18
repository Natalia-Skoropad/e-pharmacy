import 'server-only';
import { type NextRequest } from 'next/server';
import { createApiUrl } from '@e-pharmacy/api-client/core';
import { createProxyHeaders } from './proxy-headers';
import { createProxyResponse } from './proxy-response';

//===================================================================

const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 300;
const STALE_WHILE_REVALIDATE_SECONDS = 600;
const PUBLIC_GET_TIMEOUT_MS = 15_000;
const PUBLIC_RETRY_DELAY_MS = 250;
const PUBLIC_RETRYABLE_STATUSES = new Set([502, 503, 504]);

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

async function fetchPublicBackend(
  url: string,
  request: NextRequest,
  revalidate: number
) {
  let response: Response;

  for (let attempt = 1; ; attempt += 1) {
    response = await fetch(url, {
      method: 'GET',
      headers: createProxyHeaders(request, {
        forwardAccept: true,
        forwardContentType: false,
        forwardCookie: false,
      }),
      cache: 'force-cache',
      next: { revalidate },
      signal: AbortSignal.timeout(PUBLIC_GET_TIMEOUT_MS),
    } as RequestInit & { next?: { revalidate?: number } });

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
      createApiUrl(pathWithSearch),
      request,
      revalidate
    );
  } catch {
    response = Response.json(
      {
        success: false,
        message: 'The service is temporarily unavailable.',
      },
      { status: 503 }
    );
  }

  return createProxyResponse(response, {
    cacheControl: `public, s-maxage=${revalidate}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
    copySetCookie: false,
  });
}
