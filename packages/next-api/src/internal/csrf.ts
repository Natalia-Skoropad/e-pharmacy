import type { HttpMethod } from '@e-pharmacy/api-client/core';

import { BFF_CSRF_HEADER_NAME, BFF_CSRF_HEADER_VALUE } from './bff-contract';

//===================================================================

export class CsrfValidationError extends Error {
  constructor(message = 'The request failed CSRF validation.') {
    super(message);
    this.name = 'CsrfValidationError';
  }
}

//===================================================================

function toOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

//===================================================================

export function validateBffMutationRequest(
  request: Pick<Request, 'headers' | 'url'>,
  method: HttpMethod
): void {
  if (method === 'GET') return;

  if (request.headers.get(BFF_CSRF_HEADER_NAME) !== BFF_CSRF_HEADER_VALUE) {
    throw new CsrfValidationError();
  }

  const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase();
  if (fetchSite === 'cross-site') throw new CsrfValidationError();

  const requestOrigin = new URL(request.url).origin;
  const suppliedOrigin =
    toOrigin(request.headers.get('origin')) ||
    toOrigin(request.headers.get('referer'));

  if (suppliedOrigin && suppliedOrigin !== requestOrigin) {
    throw new CsrfValidationError();
  }
}
