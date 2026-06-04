const AUTH_FALLBACK_MESSAGE =
  'Unable to sign in. Please check your email and password.';

const AUTH_STATUS_MESSAGES = {
  400: 'Please check the entered data and try again.',
  401: 'Email or password is invalid.',
  404: 'Service is temporarily unavailable. Please try again later.',
  409: 'An account with this email already exists.',
  500: 'Authentication service is temporarily unavailable. Please try again later.',
} as const;

//===================================================================

type ErrorWithStatus = {
  status?: unknown;
  message?: unknown;
};

//===================================================================

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message === 'Failed to fetch' || error.message === 'fetch failed')
  );
}

//===================================================================

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  const status = (error as ErrorWithStatus).status;

  return typeof status === 'number' ? status : null;
}

//===================================================================

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (!error || typeof error !== 'object') return null;

  const message = (error as ErrorWithStatus).message;

  return typeof message === 'string' && message.trim() ? message : null;
}

//===================================================================

export function getAuthErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Cannot connect to the server. Please check that the API is running.';
  }

  const status = getErrorStatus(error);

  if (status && status in AUTH_STATUS_MESSAGES) {
    return AUTH_STATUS_MESSAGES[status as keyof typeof AUTH_STATUS_MESSAGES];
  }

  return getErrorMessage(error) ?? AUTH_FALLBACK_MESSAGE;
}
