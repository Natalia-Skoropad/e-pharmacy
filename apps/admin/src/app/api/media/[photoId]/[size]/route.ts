import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPublicGetProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

// Each image URL is immutable. The API refuses access to the stored master.
export const GET = createPublicGetProxyRoute<{
  photoId: string;
  size: 'thumb' | 'medium' | 'large';
}>({
  backendPath: ({ photoId, size }) => API_ROUTES.media.photo(photoId, size),
  enumParams: { size: ['thumb', 'medium', 'large'] },
  responseType: 'image',

  // The shared BFF cache policy allows at most 24 h; URLs are immutable.
  revalidate: 86_400,
  staleWhileRevalidate: 0,
  timeoutMs: 20_000,
});
