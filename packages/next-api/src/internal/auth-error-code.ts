const INVALIDATING_AUTH_ERROR_CODES = new Set([
  'AUTH_SESSION_INVALID',
  'AUTH_SESSION_REVOKED',
  'AUTH_USER_BLOCKED',
]);

//===================================================================

export function getAuthErrorCodeFromBody(body: string): string | null {
  if (!body) return null;

  try {
    const value = JSON.parse(body) as unknown;
    if (!value || typeof value !== 'object') return null;

    const code = (value as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
}

//===================================================================

export function isInvalidatingAuthErrorCode(
  code: string | null
): boolean {
  return Boolean(code && INVALIDATING_AUTH_ERROR_CODES.has(code));
}

//===================================================================

export async function responseInvalidatesAuthSession(
  response: Response
): Promise<boolean> {
  if (response.ok) return false;

  try {
    const body = await response.clone().text();
    return isInvalidatingAuthErrorCode(getAuthErrorCodeFromBody(body));
  } catch {
    return false;
  }
}
