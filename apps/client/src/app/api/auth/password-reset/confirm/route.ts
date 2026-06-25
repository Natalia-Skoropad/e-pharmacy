import { AUTH_PROXY_ROUTES, createAuthProxyRoute } from '@/lib/api/proxy';

//===================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

//===================================================================

export const POST = createAuthProxyRoute({
  backendPath: AUTH_PROXY_ROUTES.passwordResetConfirm,
});
