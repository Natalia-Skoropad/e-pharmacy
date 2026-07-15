import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type Params = { entityType: string; entityId: string };

//===================================================================

const backendPath = ({ entityType, entityId }: Params) =>
  `/pharmacy-notes/${entityType}/${entityId}`;

//===================================================================

export const GET = createPrivateProxyRoute<Params>({
  backendPath,
  method: 'GET',
});

export const POST = createPrivateProxyRoute<Params>({
  backendPath,
  method: 'POST',
});
