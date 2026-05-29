import { isApiError } from '@/lib/api';

import { APP_ERROR_MESSAGES } from './error-messages';

//===================================================================

type StatusMessageMap = Partial<Record<number, string>>;

type GetAppErrorMessageOptions = {
  fallback?: string;
  statusMessages?: StatusMessageMap;
  preferApiMessage?: boolean;
};

//===================================================================

const COMMON_STATUS_MESSAGES: StatusMessageMap = {
  400: APP_ERROR_MESSAGES.common.validation,
  401: APP_ERROR_MESSAGES.common.unauthorized,
  403: APP_ERROR_MESSAGES.common.forbidden,
  404: APP_ERROR_MESSAGES.common.notFound,
  409: APP_ERROR_MESSAGES.common.conflict,
  500: APP_ERROR_MESSAGES.common.server,
};

//===================================================================

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message === 'Failed to fetch' || error.message === 'fetch failed')
  );
}

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return null;
}

//===================================================================

export function getAppErrorMessage(
  error: unknown,
  options: GetAppErrorMessageOptions = {}
): string {
  const {
    fallback = APP_ERROR_MESSAGES.common.default,
    statusMessages,
    preferApiMessage = true,
  } = options;

  if (isNetworkError(error)) {
    return APP_ERROR_MESSAGES.common.network;
  }

  if (isApiError(error)) {
    const mappedMessage = statusMessages?.[error.status] ?? COMMON_STATUS_MESSAGES[error.status];
    const apiMessage = getErrorMessage(error);

    if (preferApiMessage && apiMessage) return apiMessage;
    if (mappedMessage) return mappedMessage;
    if (apiMessage) return apiMessage;

    return fallback;
  }

  return getErrorMessage(error) ?? fallback;
}
