import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

//===============================================================

const PATH = '/api/media/photos';

//===============================================================

/** Authenticated browser->BFF upload: localApiRequest injects the CSRF header. */
export async function storePharmacyPhoto(
  dataUrl: string,
  signal?: AbortSignal
) {
  return parseApiResponseData(
    await localApiRequest(PATH, { method: 'POST', body: { dataUrl }, signal }),

    (value) => value,
    { url: PATH, method: 'POST' }
  );
}
