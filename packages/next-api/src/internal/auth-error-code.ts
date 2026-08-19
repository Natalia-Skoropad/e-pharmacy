const REFRESHABLE_AUTH_ERROR_CODES = new Set(['AUTH_SESSION_INVALID']);

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

export function isRefreshableAuthErrorCode(code: string | null): boolean {
  return Boolean(code && REFRESHABLE_AUTH_ERROR_CODES.has(code));
}

//===================================================================

export function isInvalidatingAuthErrorCode(code: string | null): boolean {
  return Boolean(code && INVALIDATING_AUTH_ERROR_CODES.has(code));
}

//===================================================================

async function getAuthErrorCodeFromResponse(
  response: Response
): Promise<string | null> {
  if (response.ok) return null;

  try {
    const body = await response.clone().text();
    return getAuthErrorCodeFromBody(body);
  } catch {
    return null;
  }
}

//===================================================================

export async function responseRequiresAuthRefresh(
  response: Response
): Promise<boolean> {
  if (response.status !== 401) return false;
  return isRefreshableAuthErrorCode(
    await getAuthErrorCodeFromResponse(response)
  );
}

//===================================================================

export async function responseInvalidatesAuthSession(
  response: Response
): Promise<boolean> {
  return isInvalidatingAuthErrorCode(
    await getAuthErrorCodeFromResponse(response)
  );
}
