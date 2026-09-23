import { authRoutes } from '@e-pharmacy/api-client/contracts';
import { createAuthProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const POST = createAuthProxyRoute({
  backendPath: authRoutes.logout,
  cookieCleanup: 'always',
  authCookieMode: 'refresh-only',
});
