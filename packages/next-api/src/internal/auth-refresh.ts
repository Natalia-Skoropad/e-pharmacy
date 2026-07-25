import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

import { authRoutes } from '@e-pharmacy/api-client/contracts';
import { REFRESH_TOKEN_COOKIE_NAME } from '@e-pharmacy/config/auth';

import { executeBackendFetch } from './backend-fetch';
import { validateBackendJsonResponse } from './backend-response';
import { transformAuthResponseBody, type AuthProxyTokens } from './auth-tokens';
import { parseCookieHeader } from './cookie-header';
import { NEXT_API_TIMEOUTS_MS } from './transport-policy';

//===================================================================

export type AuthRefreshResult = Readonly<{
  response: Response;
  tokens?: AuthProxyTokens;
  invalidTokenResponse: boolean;
}>;

//===================================================================

const refreshPromises = new Map<string, Promise<AuthRefreshResult>>();

//===================================================================

export function getRequestRefreshToken(
  request: Pick<NextRequest, 'headers'>
): string | undefined {
  return parseCookieHeader(request.headers.get('cookie') ?? '').get(
    REFRESH_TOKEN_COOKIE_NAME
  );
}

//===================================================================

function getRefreshFingerprint(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}

//===================================================================

export async function refreshAuthSession(
  request: NextRequest,
  requestId: string,
  refreshToken: string
): Promise<AuthRefreshResult> {
  const fingerprint = getRefreshFingerprint(refreshToken);
  const existing = refreshPromises.get(fingerprint);
  if (existing) return existing;

  const nextPromise = executeBackendFetch({
    request,
    backendPath: authRoutes.refresh,
    method: 'POST',
    requestId,
    timeoutMs: NEXT_API_TIMEOUTS_MS.authRefresh,
    authCookieMode: 'refresh-only',
    includeAuthProxyMarker: true,
    forwardSearchParams: false,
  })
    .then(async (response) => {
      await validateBackendJsonResponse(response);

      if (!response.ok) {
        return { response, invalidTokenResponse: false };
      }

      const transformed = transformAuthResponseBody(
        await response.clone().text()
      );

      return {
        response,
        tokens: transformed.tokens,
        invalidTokenResponse: !transformed.tokens,
      };
    })
    .finally(() => {
      refreshPromises.delete(fingerprint);
    });

  refreshPromises.set(fingerprint, nextPromise);
  return nextPromise;
}
