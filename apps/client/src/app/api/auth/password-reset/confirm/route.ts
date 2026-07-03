import { AUTH_PROXY_ROUTES, createAuthProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

//===================================================================

export const POST = createAuthProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.passwordResetConfirm,
});
