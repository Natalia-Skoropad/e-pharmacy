import { ApiError, isApiError } from './api-error';
import { executeFetchWithRetry } from './fetch-executor';
import { getApiErrorMessage } from './get-api-error-message';
import { parseJsonResponse } from './json-response';
import { prepareRequestBody } from './request-body';
import type { RequestOptions } from './types';
import { tryParseApiErrorEnvelope } from '../response/api-envelope';

//===================================================================

const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

//===================================================================

function getResponseRequestId(response: Response): string | undefined {
  const value = response.headers.get('x-request-id')?.trim();
  return value && SAFE_REQUEST_ID_PATTERN.test(value) ? value : undefined;
}

//===================================================================

function getRetryAfterSeconds(response: Response): number | undefined {
  const value = response.headers.get('retry-after')?.trim();
  if (!value) return undefined;

  if (/^\d+$/.test(value)) {
    const seconds = Number.parseInt(value, 10);
    return Number.isSafeInteger(seconds) ? seconds : undefined;
  }

  const retryAt = Date.parse(value);
  if (!Number.isFinite(retryAt)) return undefined;

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1_000));
}

//===================================================================

export type HttpRequestResult<TData> = Readonly<{
  data: TData;
  status: number;
  retryCount: number;
}>;

//===================================================================

function invalidResponse(
  message: string,
  response: Response,
  payload: unknown,
  context: { url: string; method: string }
): ApiError {
  return new ApiError(message, {
    transportCode: 'INVALID_RESPONSE',
    httpStatus: response.status,
    payload,
    ...context,
  });
}

//===================================================================

async function parseFinalJsonResponse(
  response: Response,
  context: { url: string; method: string }
): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    throw invalidResponse(
      'The API returned no content where JSON was required.',
      response,
      null,
      context
    );
  }

  const parsed = await parseJsonResponse(response);

  if (!parsed.success) {
    throw invalidResponse(
      parsed.issue === 'not-json'
        ? 'The API returned a non-JSON response.'
        : 'The API returned malformed JSON.',
      response,
      null,
      context
    );
  }

  if (!response.ok) {
    const canonical = tryParseApiErrorEnvelope(parsed.value);

    throw new ApiError(
      canonical?.message ??
        getApiErrorMessage(
          parsed.value,
          response.statusText || 'Request failed'
        ),
      {
        httpStatus: response.status,
        backendCode: canonical?.code,
        requestId: canonical?.requestId ?? getResponseRequestId(response),
        retryAfterSeconds: getRetryAfterSeconds(response),
        details: canonical?.details,
        payload: parsed.value,
        ...context,
      }
    );
  }

  return parsed.value;
}

//===================================================================

function assertNoContentResponse(
  response: Response,
  context: { url: string; method: string }
): void {
  if (!response.ok) return;

  const contentLength = response.headers.get('content-length');
  const hasDeclaredBody =
    contentLength !== null && Number.parseInt(contentLength, 10) > 0;

  if (
    (response.status !== 204 && response.status !== 205) ||
    response.body !== null ||
    hasDeclaredBody
  ) {
    throw invalidResponse(
      'The API response does not satisfy the no-content contract.',
      response,
      null,
      context
    );
  }
}

//===================================================================

export async function executeHttpRequest(
  url: string,
  {
    method = 'GET',
    body,
    headers,
    cache,
    credentials,
    signal,
    timeoutMs,
    retry,
    redirect,
    responseType = 'json',
  }: RequestOptions = {},
  fetchInit: RequestInit = {}
): Promise<HttpRequestResult<unknown>> {
  const context = { url, method };

  if (method === 'GET' && body !== undefined && body !== null) {
    throw new ApiError('GET requests must not include a request body.', {
      transportCode: 'INVALID_REQUEST_BODY',
      ...context,
    });
  }

  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined;

  try {
    requestBody = prepareRequestBody(body, requestHeaders);
  } catch (error) {
    if (isApiError(error)) {
      throw new ApiError(error.message, {
        transportCode: error.transportCode ?? 'INVALID_REQUEST_BODY',
        payload: error.payload,
        cause: error.cause ?? error,
        ...context,
      });
    }
    throw error;
  }

  const execution = await executeFetchWithRetry(url, {
    method,
    init: {
      ...fetchInit,
      headers: requestHeaders,
      body: requestBody,
      cache,
      credentials,
      redirect,
    },
    signal,
    timeoutMs,
    retry,
  });

  try {
    if (responseType === 'no-content') {
      if (!execution.response.ok) {
        await parseFinalJsonResponse(execution.response, context);
      }

      assertNoContentResponse(execution.response, context);
      return {
        data: undefined,
        status: execution.response.status,
        retryCount: execution.retryCount,
      };
    }

    if (responseType === 'blob') {
      if (!execution.response.ok) {
        await parseFinalJsonResponse(execution.response, context);
      }

      return {
        data: await execution.response.blob(),
        status: execution.response.status,
        retryCount: execution.retryCount,
      };
    }

    const data = await parseFinalJsonResponse(execution.response, context);
    return {
      data,
      status: execution.response.status,
      retryCount: execution.retryCount,
    };
  } finally {
    execution.cleanup();
  }
}
