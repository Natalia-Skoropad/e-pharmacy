import type { HttpMethod } from '@e-pharmacy/api-client/core';

import { MAX_PROXY_REQUEST_BODY_BYTES } from './transport-policy';

//===================================================================

const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'text/plain',
  'application/x-www-form-urlencoded',
] as const;

//===================================================================

export class ProxyRequestBodyError extends Error {
  constructor(
    readonly status: 413 | 415,
    readonly code: 'PAYLOAD_TOO_LARGE' | 'UNSUPPORTED_MEDIA_TYPE',
    message: string
  ) {
    super(message);
    this.name = 'ProxyRequestBodyError';
  }
}

//===================================================================

function isAllowedContentType(contentType: string): boolean {
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';

  return (
    ALLOWED_CONTENT_TYPES.includes(
      mediaType as (typeof ALLOWED_CONTENT_TYPES)[number]
    ) || mediaType.endsWith('+json')
  );
}

//===================================================================

export async function readProxyRequestBody(
  request: Request,
  method: HttpMethod
): Promise<string | undefined> {
  if (method === 'GET') return undefined;

  const declaredLength = Number(request.headers.get('content-length') ?? '0');

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_PROXY_REQUEST_BODY_BYTES
  ) {
    throw new ProxyRequestBodyError(
      413,
      'PAYLOAD_TOO_LARGE',
      'The request body is too large.'
    );
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) return undefined;

  if (bytes.byteLength > MAX_PROXY_REQUEST_BODY_BYTES) {
    throw new ProxyRequestBodyError(
      413,
      'PAYLOAD_TOO_LARGE',
      'The request body is too large.'
    );
  }

  const contentType = request.headers.get('content-type') ?? '';

  if (!isAllowedContentType(contentType)) {
    throw new ProxyRequestBodyError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Only JSON, text, and URL-encoded request bodies are supported.'
    );
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new ProxyRequestBodyError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Text request bodies must contain valid UTF-8.'
    );
  }
}
