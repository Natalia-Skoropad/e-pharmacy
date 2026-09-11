const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'password',
  'email',
  'secret',
  'code',
  'resettoken',
  'reset_token',
]);

const CLIENT_PII_QUERY_KEYS = new Set([
  'name',
  'clientid',
  'client_id',
  'contact',
  'email',
  'phone',
  'address',
]);

//===================================================================

function isPrivateClientsCollectionPath(pathname: string): boolean {
  return pathname === '/clients' || pathname === '/api/clients';
}

//===================================================================

export function redactRequestPath(path: string): string {
  try {
    const url = new URL(path, 'http://next-api.internal');
    const redactClientPii = isPrivateClientsCollectionPath(url.pathname);

    url.searchParams.forEach((_value, key) => {
      const normalizedKey = key.toLowerCase();

      if (
        SENSITIVE_QUERY_KEYS.has(normalizedKey) ||
        (redactClientPii && CLIENT_PII_QUERY_KEYS.has(normalizedKey))
      ) {
        url.searchParams.set(key, '[REDACTED]');
      }
    });

    return `${url.pathname}${url.search}`;
  } catch {
    return '[INVALID_PATH]';
  }
}
