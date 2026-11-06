import 'client-only';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  BlobResponseRequestOptions,
  JsonResponseRequestOptions,
  NoContentResponseRequestOptions,
  RequestOptions,
} from '@e-pharmacy/api-client/transport';

import { getAuthorizedPharmacySelection } from '@/lib/pharmacies/selected-pharmacy-scope';

//===================================================================

/**
 * All operational reads and writes carry one selected pharmacy through BFF.
 * The backend still performs membership and resource authorization. No
 * account-scoped/owner-management API is changed by this adapter.
 */
export function operationalLocalApiRequest(
  path: string,
  options: NoContentResponseRequestOptions
): Promise<void>;

//===================================================================

export function operationalLocalApiRequest(
  path: string,
  options: BlobResponseRequestOptions
): Promise<Blob>;

//===================================================================

export function operationalLocalApiRequest(
  path: string,
  options?: JsonResponseRequestOptions
): Promise<unknown>;

//===================================================================

export async function operationalLocalApiRequest(
  path: string,
  options: RequestOptions = {}
): Promise<unknown> {
  const pharmacyId = getAuthorizedPharmacySelection();

  if (!pharmacyId) {
    throw new Error('Select a pharmacy before opening operational resources.');
  }

  const headers = new Headers(options.headers);

  // An operational caller cannot override the validated selection.
  headers.set('X-Pharmacy-ID', pharmacyId);

  return localApiRequest(path, {
    ...options,
    headers,
  } as JsonResponseRequestOptions);
}
