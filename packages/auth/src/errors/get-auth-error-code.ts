import type { AuthErrorCode, AuthErrorContext } from './auth-error-code';

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

function collectDetails(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const value = error as ErrorLike;
  const parts: string[] = [];
  for (const detail of [
    value.message,
    value.field,
    value.code,
    value.payload,
    value.data,
    value.response,
  ]) {
    if (typeof detail === 'string') parts.push(detail);
    else if (detail && typeof detail === 'object') {
      try {
        parts.push(JSON.stringify(detail));
      } catch {
        /* ignore */
      }
    }
  }
  return parts.join(' ').toLowerCase();
}

//===================================================================

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
  if (isNetworkError(error)) return 'network_error';

  const status = getStatus(error);
  const details = collectDetails(error);

  if (status === 429) return 'rate_limited';
  if (status && status >= 500) return 'server_error';
  if (details.includes('origin') && (status === 401 || status === 403))
    return 'forbidden_origin';
  if (details.includes('blocked')) return 'account_blocked';
  if (
    details.includes('pending') ||
    details.includes('verification') ||
    details.includes('moderation')
  )
    return 'account_pending';
  if (details.includes('rejected')) return 'account_rejected';

  if (context === 'login' && (status === 400 || status === 401))
    return 'invalid_credentials';
  if (context === 'register' && status === 409)
    return details.includes('phone') ? 'phone_conflict' : 'email_conflict';
  if (
    context === 'reset-password' &&
    (status === 400 || status === 401 || status === 404)
  )
    return 'invalid_reset_token';
  if (status === 422 || status === 400) return 'validation_error';
  if (status === 404) return 'not_found';
  if (status === 401) return 'invalid_credentials';
  if (status === 409)
    return details.includes('phone') ? 'phone_conflict' : 'email_conflict';

  return 'unknown';
}
