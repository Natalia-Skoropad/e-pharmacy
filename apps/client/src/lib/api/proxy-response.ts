import { NextResponse } from 'next/server';

//===================================================================

type ProxyResponseOptions = {
  cacheControl: string;
  copySetCookie?: boolean;
};

//===================================================================

function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((item) => item.trim())
    .filter(Boolean);
}

//===================================================================

function getSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders = headersWithSetCookie.getSetCookie?.();
  if (setCookieHeaders?.length) return setCookieHeaders;
  const setCookie = headers.get('set-cookie');

  return setCookie ? splitSetCookieHeader(setCookie) : [];
}

//===================================================================

function copySetCookieHeader(source: Response, target: NextResponse): void {
  getSetCookieHeaders(source.headers).forEach((setCookie) => {
    target.headers.append('set-cookie', setCookie);
  });
}

//===================================================================

export async function createProxyResponse(
  response: Response,
  { cacheControl, copySetCookie = true }: ProxyResponseOptions
): Promise<NextResponse> {
  const contentType = response.headers.get('content-type');
  const body = await response.text();

  const nextResponse = new NextResponse(body || null, {
    status: response.status,
  });

  if (contentType) {
    nextResponse.headers.set('Content-Type', contentType);
  }

  nextResponse.headers.set('Cache-Control', cacheControl);

  if (copySetCookie) {
    copySetCookieHeader(response, nextResponse);
  }

  return nextResponse;
}
