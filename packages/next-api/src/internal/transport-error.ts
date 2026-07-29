import { NextResponse, type NextRequest } from 'next/server';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { ApiErrorResponse } from '@e-pharmacy/types/api';

import { clearClientAuthCookies } from './auth-cookies';
import { InvalidBackendResponseError } from './backend-response';
import { CsrfValidationError } from './csrf';
import { InvalidBackendPathError } from './trusted-backend-path';
import { InvalidRouteParameterError } from './route-params';
import { ProxyRequestBodyError } from './request-body';
import { REQUEST_ID_HEADER_NAME } from './bff-contract';

//===================================================================

export type ProxyTransportErrorCode =
  | 'BAD_GATEWAY'
  | 'GATEWAY_TIMEOUT'
  | 'INVALID_BACKEND_RESPONSE'
  | 'CONFIGURATION_ERROR'
  | 'INVALID_ROUTE_PARAMETER'
  | 'CSRF_VALIDATION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE';

//===================================================================

type ProxyErrorBody = ApiErrorResponse &
  Readonly<{
    code: ProxyTransportErrorCode;
    requestId: string;
  }>;

export type ProxyErrorDescriptor = Readonly<{
  status: number;
  code: ProxyTransportErrorCode;
  message: string;
}>;

//===================================================================

export function describeProxyError(error: unknown): ProxyErrorDescriptor {
  if (isApiError(error)) {
    if (error.transportCode === 'TIMEOUT') {
      return {
        status: 504,
        code: 'GATEWAY_TIMEOUT',
        message: 'The upstream service did not respond in time.',
      };
    }

    if (error.transportCode === 'INVALID_RESPONSE') {
      return {
        status: 502,
        code: 'INVALID_BACKEND_RESPONSE',
        message: 'The upstream service returned an invalid response.',
      };
    }

    return {
      status: 502,
      code: 'BAD_GATEWAY',
      message: 'The upstream service could not be reached.',
    };
  }

  if (error instanceof ProxyRequestBodyError) {
    return { status: error.status, code: error.code, message: error.message };
  }

  if (error instanceof InvalidRouteParameterError) {
    return {
      status: 400,
      code: 'INVALID_ROUTE_PARAMETER',
      message: error.message,
    };
  }

  if (error instanceof CsrfValidationError) {
    return {
      status: 403,
      code: 'CSRF_VALIDATION_FAILED',
      message: error.message,
    };
  }

  if (error instanceof InvalidBackendPathError) {
    return {
      status: 500,
      code: 'CONFIGURATION_ERROR',
      message: 'The API proxy is not configured correctly.',
    };
  }

  if (error instanceof InvalidBackendResponseError) {
    return {
      status: 502,
      code: 'INVALID_BACKEND_RESPONSE',
      message: error.message,
    };
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return {
      status: 504,
      code: 'GATEWAY_TIMEOUT',
      message: 'The upstream service did not respond in time.',
    };
  }

  if (
    error instanceof Error &&
    /API_BASE_URL|BFF_PROXY_SECRET|AUTH_COOKIE/i.test(error.message)
  ) {
    return {
      status: 500,
      code: 'CONFIGURATION_ERROR',
      message: 'The API proxy is not configured correctly.',
    };
  }

  return {
    status: 502,
    code: 'BAD_GATEWAY',
    message: 'The upstream service could not be reached.',
  };
}

//===================================================================

export function createProxyErrorResponse({
  descriptor,
  requestId,
  request,
  clearAuthCookies: shouldClearAuthCookies = false,
}: {
  descriptor: ProxyErrorDescriptor;
  requestId: string;
  request?: NextRequest;
  clearAuthCookies?: boolean;
}): NextResponse {
  const body: ProxyErrorBody = {
    status: 'error',
    message: descriptor.message,
    code: descriptor.code,
    requestId,
  };

  const response = NextResponse.json(body, {
    status: descriptor.status,
    headers: {
      'Cache-Control': 'no-store',
      [REQUEST_ID_HEADER_NAME]: requestId,
    },
  });

  if (request && shouldClearAuthCookies) {
    clearClientAuthCookies(response, request);
  }

  return response;
}

//===================================================================

export function createInvalidBackendResponse({
  requestId,
  request,
  clearAuthCookies = false,
  message = 'The upstream service returned an invalid response.',
}: {
  requestId: string;
  request?: NextRequest;
  clearAuthCookies?: boolean;
  message?: string;
}): NextResponse {
  return createProxyErrorResponse({
    descriptor: {
      status: 502,
      code: 'INVALID_BACKEND_RESPONSE',
      message,
    },

    requestId,
    request,
    clearAuthCookies,
  });
}
