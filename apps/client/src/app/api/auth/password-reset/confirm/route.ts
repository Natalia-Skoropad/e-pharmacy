import { authRoutes } from '@e-pharmacy/api-client/contracts';
import { createAuthProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

//===================================================================

export const POST = createAuthProxyRoute({
  backendPath: authRoutes.passwordResetConfirm,
  markerAction: 'delete',
});
