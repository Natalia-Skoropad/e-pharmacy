import { ApiError } from '../transport/api-error';
import type { ApiErrorOptions } from '../transport/api-error';

//===================================================================

type UnknownRecord = Record<PropertyKey, unknown>;

export type ApiResponseContext = Readonly<
  Pick<ApiErrorOptions, 'url' | 'method' | 'requestId'>
>;

export type ApiSuccessEnvelope<TData> = Readonly<{
  status: 'success';
  data: TData;
  message?: string;
}>;

export type ApiEmptySuccessEnvelope = Readonly<{
  status: 'success';
  message?: string;
}>;

export type ApiErrorEnvelope = Readonly<{
  status: 'error';
  message: string;
  code?: string;
  requestId?: string;
  details?: unknown;
}>;

//===================================================================

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function hasOwn(value: UnknownRecord, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

//===================================================================

function invalidEnvelope(
  message: string,
  payload: unknown,
  context: ApiResponseContext = {}
): ApiError {
  return new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
    ...context,
  });
}

//===================================================================

function parseOptionalMessage(
  value: UnknownRecord,
  payload: unknown,
  context: ApiResponseContext
): string | undefined {
  if (!hasOwn(value, 'message')) return undefined;
  if (typeof value.message !== 'string') {
    throw invalidEnvelope(
      'API response message must be a string.',
      payload,
      context
    );
  }

  return value.message;
}

//===================================================================

export function parseApiSuccessEnvelope(
  value: unknown,
  context: ApiResponseContext = {}
): ApiSuccessEnvelope<unknown> {
  if (!isRecord(value)) {
    throw invalidEnvelope(
      'API success response must be an object.',
      value,
      context
    );
  }

  if (!hasOwn(value, 'status') || value.status !== 'success') {
    throw invalidEnvelope('API response status is not success.', value, context);
  }

  if (!hasOwn(value, 'data')) {
    throw invalidEnvelope(
      'API success response data field is missing.',
      value,
      context
    );
  }

  const message = parseOptionalMessage(value, value, context);

  return {
    status: 'success',
    data: value.data,
    ...(message === undefined ? {} : { message }),
  };
}

//===================================================================

export function parseApiNullableSuccessEnvelope(
  value: unknown,
  context: ApiResponseContext = {}
): ApiSuccessEnvelope<unknown | null> {
  return parseApiSuccessEnvelope(value, context);
}

//===================================================================

export function parseApiEmptySuccessEnvelope(
  value: unknown,
  context: ApiResponseContext = {}
): ApiEmptySuccessEnvelope {
  if (!isRecord(value)) {
    throw invalidEnvelope(
      'API empty success response must be an object.',
      value,
      context
    );
  }

  if (!hasOwn(value, 'status') || value.status !== 'success') {
    throw invalidEnvelope('API response status is not success.', value, context);
  }

  if (hasOwn(value, 'data')) {
    throw invalidEnvelope(
      'API empty success response must not contain a data field.',
      value,
      context
    );
  }

  const message = parseOptionalMessage(value, value, context);

  return {
    status: 'success',
    ...(message === undefined ? {} : { message }),
  };
}

//===================================================================

export function tryParseApiErrorEnvelope(
  value: unknown
): ApiErrorEnvelope | null {
  if (!isRecord(value) || value.status !== 'error') return null;
  if (typeof value.message !== 'string' || !value.message.trim()) return null;
  if (value.code !== undefined && typeof value.code !== 'string') return null;
  if (value.requestId !== undefined && typeof value.requestId !== 'string') {
    return null;
  }

  return {
    status: 'error',
    message: value.message,
    ...(typeof value.code === 'string' ? { code: value.code } : {}),
    ...(typeof value.requestId === 'string'
      ? { requestId: value.requestId }
      : {}),
    ...(hasOwn(value, 'details') ? { details: value.details } : {}),
  };
}
