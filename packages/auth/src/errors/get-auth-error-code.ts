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
};

const TRANSPORT_CODE_MAP: Readonly<Record<string, AuthErrorCode>> = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  INVALID_RESPONSE: 'invalid_response',
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

function collectLegacyDetails(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const value = error as ErrorLike;
  const parts: string[] = [];

  for (const detail of [value.message, value.field]) {
    if (typeof detail === 'string') parts.push(detail);
  }

  return parts.join(' ').toLowerCase();
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /failed to fetch|fetch failed|network/i.test(error.message))
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
  const details = collectLegacyDetails(error);

  if (status === 429) return 'rate_limited';
  if (status === 503) return 'service_unavailable';
  if (status === 504) return 'timeout';
  if (status && status >= 500) return 'server_error';

  // Temporary legacy fallback for backend versions that do not emit auth
  // business codes yet. Structured codes always take precedence above.
  if (details.includes('origin') && (status === 401 || status === 403)) {
    return 'forbidden_origin';
  }
  if (details.includes('blocked')) return 'account_blocked';
  if (
    details.includes('pending') ||
    details.includes('verification') ||
    details.includes('moderation')
  ) {
    return 'account_pending';
  }
  if (details.includes('rejected')) return 'account_rejected';

  if (context === 'login' && (status === 400 || status === 401)) {
    return 'invalid_credentials';
  }
  if (context === 'register' && status === 409) {
    return details.includes('phone') ? 'phone_conflict' : 'email_conflict';
  }
  if (
    context === 'reset-password' &&
    (status === 400 || status === 401 || status === 404)
  ) {
    return 'invalid_reset_token';
  }
  if (status === 422 || status === 400) return 'validation_error';
  if (status === 404) return 'not_found';
  if (status === 401) return 'invalid_credentials';
  if (status === 409) {
    return details.includes('phone') ? 'phone_conflict' : 'email_conflict';
  }

  return 'unknown';
}
