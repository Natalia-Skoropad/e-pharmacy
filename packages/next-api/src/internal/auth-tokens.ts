export type AuthProxyTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}>;

export type AuthBodyTransformResult = Readonly<{
  body: string;
  tokens?: AuthProxyTokens;
  issue?: 'invalid-json' | 'missing-tokens' | 'malformed-tokens';
}>;

//===================================================================

const MAX_AUTH_TOKEN_LIFETIME_SECONDS = 365 * 24 * 60 * 60;

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

//===================================================================

function isValidLifetime(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_AUTH_TOKEN_LIFETIME_SECONDS
  );
}

//===================================================================

export function transformAuthResponseBody(
  body: string
): AuthBodyTransformResult {
  if (!body) return { body, issue: 'missing-tokens' };

  let parsed: unknown;

  try {
    parsed = JSON.parse(body);
  } catch {
    return { body: '', issue: 'invalid-json' };
  }

  if (!isRecord(parsed)) {
    return { body: '', issue: 'malformed-tokens' };
  }

  const data = parsed.data;

  if (!isRecord(data)) {
    return { body: JSON.stringify(parsed), issue: 'missing-tokens' };
  }

  const rawTokens = data.tokens;
  const { tokens: _tokens, ...safeData } = data;
  void _tokens;
  parsed.data = safeData;
  const safeBody = JSON.stringify(parsed);

  if (rawTokens === undefined) {
    return { body: safeBody, issue: 'missing-tokens' };
  }

  if (
    !isRecord(rawTokens) ||
    !isNonEmptyString(rawTokens.accessToken) ||
    !isNonEmptyString(rawTokens.refreshToken) ||
    !isValidLifetime(rawTokens.accessTokenExpiresIn) ||
    !isValidLifetime(rawTokens.refreshTokenExpiresIn)
  ) {
    return { body: safeBody, issue: 'malformed-tokens' };
  }

  return {
    body: safeBody,
    tokens: {
      accessToken: rawTokens.accessToken,
      refreshToken: rawTokens.refreshToken,
      accessTokenExpiresIn: rawTokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: rawTokens.refreshTokenExpiresIn,
    },
  };
}
