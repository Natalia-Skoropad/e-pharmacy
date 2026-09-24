import 'client-only';

import {
  parseApiEmptyResponse,
  parseApiResponseData,
} from '@e-pharmacy/api-client/response';

import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  AdminEmployeeDocumentResponse,
  AdminEmployeeDocumentsResponse,
  AdminEmployeeDocumentUploadPayload,
} from '@e-pharmacy/types/admin';

import type { EntityId } from '@e-pharmacy/types/primitives';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';
import {
  parseAdminEmployeeDocumentResponse,
  parseAdminEmployeeDocumentsResponse,
} from '@/lib/profile/admin-employee-documents';

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

export async function getMyAdminDocuments(
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminEmployeeDocumentsResponse> {
  const path = ADMIN_API_ROUTES.adminEmployees.myDocuments;

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminEmployeeDocumentsResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function downloadMyAdminDocument(
  documentId: EntityId
): Promise<string> {
  const path = ADMIN_API_ROUTES.adminEmployees.myDocument(documentId);
  const blob = await localApiRequest(path, { responseType: 'blob' });

  return blobToDataUrl(blob);
}

//===================================================================

export async function uploadMyAdminDocument(
  payload: AdminEmployeeDocumentUploadPayload
): Promise<AdminEmployeeDocumentResponse> {
  const path = ADMIN_API_ROUTES.adminEmployees.myDocuments;

  return parseApiResponseData(
    await localApiRequest(path, { method: 'POST', body: payload }),
    parseAdminEmployeeDocumentResponse,
    { url: path, method: 'POST' }
  );
}

//===================================================================

export async function replaceMyAdminDocument(
  documentId: EntityId,
  payload: AdminEmployeeDocumentUploadPayload
): Promise<AdminEmployeeDocumentResponse> {
  const path = ADMIN_API_ROUTES.adminEmployees.myDocument(documentId);

  return parseApiResponseData(
    await localApiRequest(path, { method: 'PUT', body: payload }),
    parseAdminEmployeeDocumentResponse,
    { url: path, method: 'PUT' }
  );
}

//===================================================================

export async function deleteMyAdminDocument(
  documentId: EntityId
): Promise<void> {
  const path = ADMIN_API_ROUTES.adminEmployees.myDocument(documentId);

  parseApiEmptyResponse(await localApiRequest(path, { method: 'DELETE' }), {
    url: path,
    method: 'DELETE',
  });
}
