import { ApiError } from './api-error';
import { isJsonContentType } from './json-response';

//===================================================================

function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof ReadableStream !== 'undefined' && value instanceof ReadableStream
  );
}

//===================================================================

export function isNativeRequestBody(body: unknown): body is BodyInit {
  if (typeof body === 'string') return true;
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return true;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  if (
    typeof URLSearchParams !== 'undefined' &&
    body instanceof URLSearchParams
  ) {
    return true;
  }
  if (typeof Blob !== 'undefined' && body instanceof Blob) return true;
  if (isReadableStream(body)) return true;

  return false;
}

//===================================================================

function isJsonSerializableContainer(
  value: unknown
): value is Readonly<Record<string, unknown>> | readonly unknown[] {
  if (Array.isArray(value)) return true;
  if (!value || typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

//===================================================================

export function prepareRequestBody(
  body: unknown,
  headers: Headers
): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    if (headers.has('Content-Type')) {
      throw new ApiError(
        'Do not set Content-Type manually for FormData requests.',
        { transportCode: 'INVALID_REQUEST_BODY' }
      );
    }
    return body;
  }

  if (isNativeRequestBody(body)) return body;

  if (!isJsonSerializableContainer(body)) {
    throw new ApiError('The request body format is not supported.', {
      transportCode: 'INVALID_REQUEST_BODY',
    });
  }

  const configuredContentType = headers.get('Content-Type');
  if (configuredContentType && !isJsonContentType(configuredContentType)) {
    throw new ApiError('Object request bodies require a JSON Content-Type.', {
      transportCode: 'INVALID_REQUEST_BODY',
    });
  }

  if (!configuredContentType) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return JSON.stringify(body);
  } catch (error) {
    throw new ApiError('The request body could not be serialized as JSON.', {
      transportCode: 'INVALID_REQUEST_BODY',
      cause: error,
    });
  }
}
