import { ApiError } from './api-error';
import { isJsonContentType } from './json-response';
import type { ApiRequestBody, JsonRequestBody } from './types';

//===================================================================

function invalidRequestBody(message: string, cause?: unknown): ApiError {
  return new ApiError(message, {
    transportCode: 'INVALID_REQUEST_BODY',
    cause,
  });
}

//===================================================================

function isJsonSerializableContainer(value: unknown): value is JsonRequestBody {
  if (Array.isArray(value)) return true;
  if (!value || typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

//===================================================================

function hasCustomToJson(value: JsonRequestBody): boolean {
  return Object.hasOwn(value, 'toJSON');
}

//===================================================================

function isUrlEncodedContentType(contentType: string): boolean {
  return contentType
    .split(';', 1)[0]
    ?.trim()
    .toLowerCase() === 'application/x-www-form-urlencoded';
}

//===================================================================

function assertNotMultipart(headers: Headers): void {
  const contentType = headers.get('Content-Type');

  if (contentType?.trim().toLowerCase().startsWith('multipart/form-data')) {
    throw invalidRequestBody(
      'Multipart request bodies are not supported by this transport.'
    );
  }
}

//===================================================================

export function prepareRequestBody(
  body: ApiRequestBody | null | undefined,
  headers: Headers
): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;

  assertNotMultipart(headers);

  if (typeof body === 'string') return body;

  if (body instanceof URLSearchParams) {
    const configuredContentType = headers.get('Content-Type');

    if (
      configuredContentType &&
      !isUrlEncodedContentType(configuredContentType)
    ) {
      throw invalidRequestBody(
        'URLSearchParams request bodies require application/x-www-form-urlencoded.'
      );
    }

    return body;
  }

  if (!isJsonSerializableContainer(body)) {
    throw invalidRequestBody('The request body format is not supported.');
  }

  if (hasCustomToJson(body)) {
    throw invalidRequestBody(
      'Request bodies with a custom toJSON method are not supported.'
    );
  }

  const configuredContentType = headers.get('Content-Type');
  if (configuredContentType && !isJsonContentType(configuredContentType)) {
    throw invalidRequestBody(
      'Object request bodies require a JSON Content-Type.'
    );
  }

  if (!configuredContentType) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return JSON.stringify(body);
  } catch (error) {
    throw invalidRequestBody(
      'The request body could not be serialized as JSON.',
      error
    );
  }
}
