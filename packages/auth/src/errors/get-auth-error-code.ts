import type { AuthErrorCode } from './auth-error-code';

//===================================================================

type AuthErrorContext =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password';

//===================================================================

type ErrorLike = {
  status?: unknown;
  message?: unknown;
  field?: unknown;
  code?: unknown;
  payload?: unknown;
  data?: unknown;
  response?: unknown;
};

//===================================================================

const BUSINESS_CODE_MAP: Readonly<Record<string, AuthErrorCode>> = {
  AUTH_INVALID_CREDENTIALS: 'invalid_credentials',
  AUTH_EMAIL_CONFLICT: 'email_conflict',
  AUTH_PHONE_CONFLICT: 'phone_conflict',
  AUTH_USER_BLOCKED: 'account_blocked',
  AUTH_SESSION_INVALID: 'session_invalid',
  AUTH_SESSION_REVOKED: 'session_revoked',
  AUTH_RESET_TOKEN_INVALID: 'invalid_reset_token',
  AUTH_RATE_LIMITED: 'rate_limited',
  AUTH_FORBIDDEN_ORIGIN: 'forbidden_origin',
  AUTH_CSRF_FAILED: 'csrf_failed',
  AUTH_VALIDATION_FAILED: 'validation_error',
  AUTH_RESOURCE_NOT_FOUND: 'not_found',
  AUTH_SERVICE_UNAVAILABLE: 'service_unavailable',
  AUTH_INVALID_RESPONSE: 'invalid_response',
  AUTH_REGISTRATION_SESSION_FAILED: 'registration_session_failed',
};

//===================================================================

const TRANSPORT_CODE_MAP: Readonly<Record<string, AuthErrorCode>> = {
  NETWORK_ERROR: 'network_error',
  BAD_GATEWAY: 'service_unavailable',
  GATEWAY_TIMEOUT: 'timeout',
  TIMEOUT: 'timeout',
  INVALID_RESPONSE: 'invalid_response',
  INVALID_BACKEND_RESPONSE: 'invalid_response',
  CSRF_VALIDATION_FAILED: 'csrf_failed',
};

//===================================================================

const LEGACY_MESSAGE_MAP: Readonly<Record<string, AuthErrorCode>> = {
  'email or password is invalid': 'invalid_credentials',
  'email is already in use': 'email_conflict',
  'phone number is already in use': 'phone_conflict',
  'user is blocked': 'account_blocked',
  'authorization token is invalid': 'session_invalid',
  'authorization token is required': 'session_invalid',
  'password reset link is invalid or expired': 'invalid_reset_token',
  'request origin is not allowed': 'forbidden_origin',
};

//===================================================================

function getStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as ErrorLike;

  if (typeof value.status === 'number') return value.status;

  if (value.response && typeof value.response === 'object') {
    const status = (value.response as ErrorLike).status;
    if (typeof status === 'number') return status;
  }

  return null;
}

//===================================================================

function getStringCode(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const code = (value as ErrorLike).code;
  return typeof code === 'string' ? code : null;
}

//===================================================================

function getStructuredCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const value = error as ErrorLike;

  for (const candidate of [value.payload, value.data, value.response]) {
    const code = getStringCode(candidate);
    if (code) return code;

    if (candidate && typeof candidate === 'object') {
      const nestedCode = getStringCode((candidate as ErrorLike).data);
      if (nestedCode) return nestedCode;
    }
  }

  return getStringCode(error);
}

//===================================================================

function getLegacyMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const message = (error as ErrorLike).message;
  return typeof message === 'string' ? message.trim().toLowerCase() : null;
}

//===================================================================

function getField(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const field = (error as ErrorLike).field;
  return typeof field === 'string' ? field.trim().toLowerCase() : null;
}

//===================================================================

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;

  const normalizedMessage = error.message.trim().toLowerCase();
  return (
    normalizedMessage === 'failed to fetch' ||
    normalizedMessage === 'fetch failed' ||
    normalizedMessage === 'network error'
  );
}

//===================================================================

export function getAuthErrorCode(
  error: unknown,
  context?: AuthErrorContext
): AuthErrorCode {
  const structuredCode = getStructuredCode(error);

  if (structuredCode) {
    const businessCode = BUSINESS_CODE_MAP[structuredCode];
    if (businessCode) return businessCode;

    const transportCode = TRANSPORT_CODE_MAP[structuredCode];
    if (transportCode) return transportCode;
  }

  if (isNetworkError(error)) return 'network_error';

  const status = getStatus(error);
  const legacyMessage = getLegacyMessage(error);
  const legacyCode = legacyMessage
    ? LEGACY_MESSAGE_MAP[legacyMessage]
    : undefined;

  if (legacyCode) return legacyCode;

  if (status === 429) return 'rate_limited';
  if (status === 502 || status === 503) return 'service_unavailable';
  if (status === 504) return 'timeout';
  if (status && status >= 500) return 'server_error';

  if (context === 'login' && (status === 400 || status === 401)) {
    return 'invalid_credentials';
  }

  if (context === 'register' && status === 409) {
    return getField(error) === 'phone' ? 'phone_conflict' : 'email_conflict';
  }

  if (
    context === 'reset-password' &&
    (status === 400 || status === 401 || status === 404)
  ) {
    return 'invalid_reset_token';
  }

  if (status === 422 || status === 400) return 'validation_error';
  if (status === 404) return 'not_found';
  if (status === 401) return 'session_invalid';

  return 'unknown';
}
