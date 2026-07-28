import { ApiError } from '../core/api-error';

//===================================================================

type UnknownRecord = Record<PropertyKey, unknown>;

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

function invalidEnvelope(message: string, payload: unknown): ApiError {
  return new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    payload,
  });
}

//===================================================================

function parseOptionalMessage(
  value: UnknownRecord,
  payload: unknown
): string | undefined {
  if (!hasOwn(value, 'message')) return undefined;
  if (typeof value.message !== 'string') {
    throw invalidEnvelope('API response message must be a string.', payload);
  }

  return value.message;
}

//===================================================================

export function parseApiSuccessEnvelope(
  value: unknown
): ApiSuccessEnvelope<unknown> {
  if (!isRecord(value)) {
    throw invalidEnvelope('API success response must be an object.', value);
  }

  if (!hasOwn(value, 'status') || value.status !== 'success') {
    throw invalidEnvelope('API response status is not success.', value);
  }

  if (!hasOwn(value, 'data')) {
    throw invalidEnvelope('API success response data field is missing.', value);
  }

  const message = parseOptionalMessage(value, value);

  return {
    status: 'success',
    data: value.data,
    ...(message === undefined ? {} : { message }),
  };
}

//===================================================================

export function parseApiNullableSuccessEnvelope(
  value: unknown
): ApiSuccessEnvelope<unknown | null> {
  return parseApiSuccessEnvelope(value);
}

//===================================================================

export function parseApiEmptySuccessEnvelope(
  value: unknown
): ApiEmptySuccessEnvelope {
  if (!isRecord(value)) {
    throw invalidEnvelope(
      'API empty success response must be an object.',
      value
    );
  }

  if (!hasOwn(value, 'status') || value.status !== 'success') {
    throw invalidEnvelope('API response status is not success.', value);
  }

  if (hasOwn(value, 'data')) {
    throw invalidEnvelope(
      'API empty success response must not contain a data field.',
      value
    );
  }

  const message = parseOptionalMessage(value, value);

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
