import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import { adminApiRoutes as ADMIN_API_ROUTES } from '@/lib/api/routes/admin-api-routes';

import {
  parseAdminAuditDetailsResponse,
  parseAdminAuditListResponse,
  type AdminAuditDetailsResponse,
  type AdminAuditListResponse,
  type AdminAuditQueryParams,
} from '@/lib/audit/admin-audit';

//===================================================================

export async function getAdminAuditLogs(
  params: AdminAuditQueryParams = {},
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminAuditListResponse> {
  const path = appendQueryParams(ADMIN_API_ROUTES.audit.list, params);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminAuditListResponse,
    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getAdminAuditLogDetails(
  auditLogId: string,
  options?: Readonly<{ signal?: AbortSignal }>
): Promise<AdminAuditDetailsResponse> {
  const path = ADMIN_API_ROUTES.audit.details(auditLogId);

  return parseApiResponseData(
    await localApiRequest(path, { signal: options?.signal }),
    parseAdminAuditDetailsResponse,
    { url: path, method: 'GET' }
  );
}
