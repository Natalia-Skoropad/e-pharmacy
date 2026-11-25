import 'client-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { appendQueryParams } from '@e-pharmacy/api-client/transport';

import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { isRecord } from '@e-pharmacy/utils/guards';

import { isISODateTimeString } from '@e-pharmacy/validation/dates';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import type { CreateAdminPharmacyCommentPayload } from '@e-pharmacy/types/admin';

import {
  parseAdminAuditActorsResponse,
  parseAdminAuditDetailsResponse,
  parseAdminAuditListResponse,
  type AdminAuditQueryParams,
} from '@/lib/audit/admin-audit';

import { adminApiRoutes } from '@/lib/api/routes/admin-api-routes';

//===================================================================

const routes = adminApiRoutes.productRequests;

//===================================================================

type Options = Readonly<{ signal?: AbortSignal }>;

//===================================================================

function parseComment(raw: unknown, id: string) {
  if (
    !isRecord(raw) ||
    raw.productRequestId !== id ||
    typeof raw.id !== 'string' ||
    !isValidObjectId(raw.id) ||
    typeof raw.text !== 'string' ||
    !raw.text.trim() ||
    !isISODateTimeString(raw.createdAt) ||
    !isRecord(raw.author) ||
    typeof raw.author.userId !== 'string' ||
    !isValidObjectId(raw.author.userId) ||
    typeof raw.author.displayName !== 'string' ||
    !raw.author.displayName.trim() ||
    (raw.author.pictureUrl !== undefined &&
      (typeof raw.author.pictureUrl !== 'string' ||
        !raw.author.pictureUrl.trim()))
  ) {
    throw new Error('Invalid product request comment.');
  }

  return {
    id: raw.id,
    text: raw.text,
    createdAt: raw.createdAt,

    author: {
      userId: raw.author.userId,
      displayName: raw.author.displayName,

      ...(typeof raw.author.pictureUrl === 'string'
        ? { pictureUrl: raw.author.pictureUrl }
        : {}),
    },
  };
}

//===================================================================

async function list(id: string, options?: Options) {
  return parseApiResponseData(
    await localApiRequest(routes.comments(id), { signal: options?.signal }),

    (raw) => {
      if (!isRecord(raw) || !Array.isArray(raw.comments))
        throw new Error('Invalid comments.');

      return { comments: raw.comments.map((item) => parseComment(item, id)) };
    }
  );
}

//===================================================================

async function create(
  id: string,
  payload: CreateAdminPharmacyCommentPayload,
  options?: Options
) {
  return parseApiResponseData(
    await localApiRequest(routes.comments(id), {
      method: 'POST',
      body: payload,
      signal: options?.signal,
    }),

    (raw) => {
      if (!isRecord(raw)) throw new Error('Invalid comment.');

      return { comment: parseComment(raw.comment, id) };
    }
  );
}

//===================================================================

async function remove(id: string, commentId: string, options?: Options) {
  await localApiRequest(routes.comment(id, commentId), {
    method: 'DELETE',
    signal: options?.signal,
    responseType: 'no-content',
  });
}

//===================================================================

export const productRequestCommentsApi = { list, create, remove };

//===================================================================

export async function getRequestActivity(
  id: string,
  params: AdminAuditQueryParams,
  options?: Options
) {
  return parseApiResponseData(
    await localApiRequest(appendQueryParams(routes.activity(id), params), {
      signal: options?.signal,
    }),

    parseAdminAuditListResponse
  );
}

//===================================================================

export async function getRequestActivityActors(id: string, options?: Options) {
  return parseApiResponseData(
    await localApiRequest(routes.activityActors(id), {
      signal: options?.signal,
    }),

    parseAdminAuditActorsResponse
  );
}

//===================================================================

export async function getRequestActivityDetails(
  id: string,
  auditId: string,
  options?: Options
) {
  return parseApiResponseData(
    await localApiRequest(routes.activityDetail(id, auditId), {
      signal: options?.signal,
    }),

    parseAdminAuditDetailsResponse
  );
}
