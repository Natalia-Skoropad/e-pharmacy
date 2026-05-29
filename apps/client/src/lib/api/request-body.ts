//===================================================================

export function isNativeRequestBody(body: unknown): body is BodyInit {
  if (typeof body === 'string') return true;
  if (body instanceof ArrayBuffer) return true;

  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;

  if (
    typeof URLSearchParams !== 'undefined' &&
    body instanceof URLSearchParams
  ) {
    return true;
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) return true;

  return false;
}

//===================================================================

export function prepareRequestBody(
  body: unknown,
  headers: Headers
): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isNativeRequestBody(body)) {
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
}
