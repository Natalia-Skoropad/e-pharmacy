export type AuthErrorContext =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password';

export type AuthErrorMessageOptions = {
  context?: AuthErrorContext;
};

//===================================================================

const AUTH_MESSAGES = {
  invalidCredentials: 'Invalid email or password.',
  emailInUse: 'This email is already in use.',
  phoneInUse: 'This phone number is already in use.',
  serverUnavailable:
    'The server is temporarily unavailable. Please try again later.',
  generic: 'Something went wrong. Please try again.',
} as const;

//===================================================================

type ErrorWithDetails = {
  status?: unknown;
  message?: unknown;
  field?: unknown;
  code?: unknown;
  data?: unknown;
  response?: unknown;
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

  const directStatus = (error as ErrorWithDetails).status;
  if (typeof directStatus === 'number') return directStatus;
  const response = (error as ErrorWithDetails).response;

  if (response && typeof response === 'object') {
    const responseStatus = (response as ErrorWithDetails).status;

    if (typeof responseStatus === 'number') return responseStatus;
  }

  return null;
}

//===================================================================

function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (!error || typeof error !== 'object') return null;
  const message = (error as ErrorWithDetails).message;

  return typeof message === 'string' && message.trim() ? message : null;
}

//===================================================================

function collectErrorDetails(error: unknown): string {
  if (!error || typeof error !== 'object') return '';

  const details: string[] = [];
  const errorObject = error as ErrorWithDetails;

  [
    errorObject.message,
    errorObject.field,
    errorObject.code,
    errorObject.data,
    errorObject.response,
  ].forEach((value) => {
    if (typeof value === 'string') {
      details.push(value);
      return;
    }

    if (value && typeof value === 'object') {
      try {
        details.push(JSON.stringify(value));
      } catch {
        // Ignore non-serializable error details.
      }
    }
  });

  return details.join(' ').toLowerCase();
}

//===================================================================

function getRegisterConflictMessage(error: unknown): string {
  const details = collectErrorDetails(error);
  if (details.includes('phone')) return AUTH_MESSAGES.phoneInUse;

  return AUTH_MESSAGES.emailInUse;
}

//===================================================================

function getStatusAuthErrorMessage(
  status: number,
  error: unknown,
  context?: AuthErrorContext
): string {
  if (status >= 500) return AUTH_MESSAGES.serverUnavailable;

  if (context === 'login' && (status === 400 || status === 401)) {
    return AUTH_MESSAGES.invalidCredentials;
  }

  if (context === 'register' && status === 409) {
    return getRegisterConflictMessage(error);
  }

  if (context === 'forgot-password') {
    return status === 400
      ? AUTH_MESSAGES.generic
      : AUTH_MESSAGES.serverUnavailable;
  }

  if (context === 'reset-password' && (status === 400 || status === 401)) {
    return AUTH_MESSAGES.generic;
  }

  if (status === 401) return AUTH_MESSAGES.invalidCredentials;
  if (status === 409) return getRegisterConflictMessage(error);
  if (status === 404) return AUTH_MESSAGES.serverUnavailable;

  return AUTH_MESSAGES.generic;
}

//===================================================================

export function getAuthErrorMessage(
  error: unknown,
  options: AuthErrorMessageOptions = {}
): string {
  if (isNetworkError(error)) {
    return AUTH_MESSAGES.serverUnavailable;
  }

  const status = getErrorStatus(error);

  if (status) {
    return getStatusAuthErrorMessage(status, error, options.context);
  }

  return getErrorMessage(error) ?? AUTH_MESSAGES.generic;
}
