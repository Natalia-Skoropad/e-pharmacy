import { NextResponse, type NextRequest } from 'next/server';

import { createApiUrl } from './api-url';

//===================================================================

const DEFAULT_PUBLIC_REVALIDATE_SECONDS = 300;
const STALE_WHILE_REVALIDATE_SECONDS = 600;

//===================================================================

type PublicBackendProxyOptions = {
  backendPath: string;
  request: NextRequest;
  revalidate?: number;
};

//===================================================================

function createPublicProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const accept = request.headers.get('accept');

  if (accept) headers.set('Accept', accept);

  return headers;
}

//===================================================================

function createBackendPathWithSearch(
  backendPath: string,
  request: NextRequest
): string {
  const search = request.nextUrl.search;

  return search ? `${backendPath}${search}` : backendPath;
}

//===================================================================

async function createPublicProxyResponse(
  response: Response,
  revalidate: number
): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const body = await response.text();

  const nextResponse = new NextResponse(body || null, {
    status: response.status,
  });

  if (contentType) {
    nextResponse.headers.set('Content-Type', contentType);
  }

  nextResponse.headers.set(
    'Cache-Control',
    `public, s-maxage=${revalidate}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`
  );

  return nextResponse;
}

//===================================================================

/**
 * Proxies public same-origin `/api/*` GET requests to the backend API.
 * Query params are forwarded, and cache headers are added for CDN/server reuse.
 */
export async function proxyPublicBackendRequest({
  backendPath,
  request,
  revalidate = DEFAULT_PUBLIC_REVALIDATE_SECONDS,
}: PublicBackendProxyOptions): Promise<NextResponse> {
  const pathWithSearch = createBackendPathWithSearch(backendPath, request);

  const response = await fetch(createApiUrl(pathWithSearch), {
    method: 'GET',
    headers: createPublicProxyHeaders(request),
    cache: 'force-cache',
    next: { revalidate },
  });

  return createPublicProxyResponse(response, revalidate);
}
