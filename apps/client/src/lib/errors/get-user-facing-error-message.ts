import { isApiError } from '@e-pharmacy/api-client/transport';

import { APP_ERROR_MESSAGES } from './error-messages';

//===================================================================

type StatusMessageMap = Partial<Record<number, string>>;
type BackendCodeMessageMap = Readonly<Record<string, string>>;

//===================================================================

type GetUserFacingErrorMessageOptions = {
  fallback?: string;
  statusMessages?: StatusMessageMap;
  backendCodeMessages?: BackendCodeMessageMap;
  allowApiMessage?: boolean;
};

//===================================================================

const COMMON_STATUS_MESSAGES: StatusMessageMap = {
  400: APP_ERROR_MESSAGES.common.validation,
  401: APP_ERROR_MESSAGES.common.unauthorized,
  403: APP_ERROR_MESSAGES.common.forbidden,
  404: APP_ERROR_MESSAGES.common.notFound,
  409: APP_ERROR_MESSAGES.common.conflict,
  429: 'Too many requests. Please wait and try again.',
  500: APP_ERROR_MESSAGES.common.server,
  502: APP_ERROR_MESSAGES.common.server,
  503: APP_ERROR_MESSAGES.common.server,
  504: APP_ERROR_MESSAGES.common.server,
};

//===================================================================

function getErrorMessage(error: unknown): string | null {
  return error instanceof Error && error.message.trim() ? error.message : null;
}

//===================================================================

export function getUserFacingErrorMessage(
  error: unknown,
  options: GetUserFacingErrorMessageOptions = {}
): string {
  const {
    fallback = APP_ERROR_MESSAGES.common.default,
    statusMessages,
    backendCodeMessages = {},
    allowApiMessage = false,
  } = options;

  if (!isApiError(error)) return getErrorMessage(error) ?? fallback;

  if (error.transportCode === 'ABORTED') return '';
  if (error.transportCode === 'NETWORK_ERROR') {
    return APP_ERROR_MESSAGES.common.network;
  }

  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }

  if (error.transportCode === 'INVALID_RESPONSE') {
    return 'The server returned an invalid response. Please try again later.';
  }

  if (error.backendCode && backendCodeMessages[error.backendCode]) {
    return backendCodeMessages[error.backendCode];
  }

  const mappedMessage =
    (error.httpStatus === undefined
      ? undefined
      : (statusMessages?.[error.httpStatus] ??
        COMMON_STATUS_MESSAGES[error.httpStatus])) ?? fallback;

  if (allowApiMessage) return getErrorMessage(error) ?? mappedMessage;
  return mappedMessage;
}
