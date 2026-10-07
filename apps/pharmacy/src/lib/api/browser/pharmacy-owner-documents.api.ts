import 'client-only';

import {
  parseApiEmptyResponse,
  parseApiResponseData,
  parsePharmacyOwnerDocumentResponse,
  parsePharmacyOwnerDocumentsResponse,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  PharmacyOwnerDocumentResponse,
  PharmacyOwnerDocumentsResponse,
  PharmacyOwnerDocumentUploadPayload,
} from '@e-pharmacy/types/pharmacy-owners';

import type { EntityId } from '@e-pharmacy/types/primitives';

import { pharmacyApiRoutes as PHARMACY_API_ROUTES } from '@/lib/api/routes/pharmacy-api-routes';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

//===================================================================

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Downloaded document could not be read.'));
    });

    reader.addEventListener('error', () => {
      reject(
        reader.error ?? new Error('Downloaded document could not be read.')
      );
    });

    reader.readAsDataURL(blob);
  });
}

//===================================================================

export async function getMyPharmacyOwnerDocuments(
  options?: BrowserReadRequestOptions
): Promise<PharmacyOwnerDocumentsResponse> {
  const path = PHARMACY_API_ROUTES.pharmacyOwners.myDocuments;

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),
    parsePharmacyOwnerDocumentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function uploadMyPharmacyOwnerDocument(
  payload: PharmacyOwnerDocumentUploadPayload
): Promise<PharmacyOwnerDocumentResponse> {
  const path = PHARMACY_API_ROUTES.pharmacyOwners.myDocuments;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parsePharmacyOwnerDocumentResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function getMyPharmacyOwnerDocument(
  documentId: EntityId,
  options?: BrowserReadRequestOptions
): Promise<string> {
  const path = PHARMACY_API_ROUTES.pharmacyOwners.myDocument(documentId);

  const blob = await localApiRequest(path, {
    ...sanitizeBrowserReadRequestOptions(options),
    responseType: 'blob',
  });

  return blobToDataUrl(blob);
}

//===================================================================

export async function deleteMyPharmacyOwnerDocument(
  documentId: EntityId
): Promise<void> {
  const path = PHARMACY_API_ROUTES.pharmacyOwners.myDocument(documentId);

  parseApiEmptyResponse(await localApiRequest(path, { method: 'DELETE' }), {
    url: path,
    method: 'DELETE',
  });
}
