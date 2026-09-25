import type { Request } from 'express';

import { ADMIN_ACCESS_ERROR_CODES } from '../constants/admin-access';
import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  AdminEmployeeDocumentParams,
  AdminEmployeeDocumentUploadInput,
} from '../schemas/admin-employee-document.schema';

import type { UpdateMyAdminEmployeeProfileInput } from '../schemas/admin-employee-profile.schema';

import type {
  AdminEmployeePrivateNoteParams,
  AdminEmployeePrivateNotesQuery,
  CreateAdminEmployeePrivateNoteInput,
} from '../schemas/admin-employee-note.schema';

import {
  createMyAdminEmployeeDocumentService,
  deleteMyAdminEmployeeDocumentService,
  getMyAdminEmployeeDocumentContentService,
  listMyAdminEmployeeDocumentsService,
  replaceMyAdminEmployeeDocumentService,
} from '../services/admin-employee-document.service';

import { updateMyAdminEmployeeProfileService } from '../services/admin-employee-profile.service';

import {
  createMyAdminEmployeePrivateNoteService,
  deleteMyAdminEmployeePrivateNoteService,
  listMyAdminEmployeePrivateNotesService,
} from '../services/admin-employee-note.service';

import type { ValidatedResponse } from '../types/validated-request';

import { sendSuccessResponse } from '../utils/apiResponse';
import { httpError } from '../utils/httpError';

//===============================================================

function requireSelfAdminContext(req: Request): {
  userId: string;
  authorization: NonNullable<Request['adminAuthorization']>;
} {
  const userId = req.user?.id;
  const authorization = req.adminAuthorization;

  if (!userId || !authorization) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'Admin access is required.',
      undefined,
      ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED
    );
  }

  return { userId, authorization };
}

//===============================================================

function encodeContentDispositionFilename(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

//===============================================================

export async function updateMyAdminEmployeeProfile(
  req: Request,
  res: ValidatedResponse<UpdateMyAdminEmployeeProfileInput>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);

  const user = await updateMyAdminEmployeeProfileService(
    userId,
    authorization,
    res.locals.validated.body
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Admin profile was updated successfully.',
    data: { user },
  });
}

//===============================================================

export async function listMyAdminEmployeeDocuments(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);
  const documents = await listMyAdminEmployeeDocumentsService(
    userId,
    authorization
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { documents },
  });
}

//===============================================================

export async function getMyAdminEmployeeDocument(
  req: Request,
  res: ValidatedResponse<unknown, AdminEmployeeDocumentParams>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);
  const { documentId } = res.locals.validated.params;

  const { document, content } = await getMyAdminEmployeeDocumentContentService(
    userId,
    authorization,
    documentId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));

  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeContentDispositionFilename(document.name)}`
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//===============================================================

export async function createMyAdminEmployeeDocument(
  req: Request,
  res: ValidatedResponse<AdminEmployeeDocumentUploadInput>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);

  const document = await createMyAdminEmployeeDocumentService(
    userId,
    authorization,
    res.locals.validated.body,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Admin document was uploaded successfully.',
    data: { document },
  });
}

//===============================================================

export async function replaceMyAdminEmployeeDocument(
  req: Request,
  res: ValidatedResponse<
    AdminEmployeeDocumentUploadInput,
    AdminEmployeeDocumentParams
  >
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);
  const { documentId } = res.locals.validated.params;

  const document = await replaceMyAdminEmployeeDocumentService(
    userId,
    authorization,
    documentId,
    res.locals.validated.body,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Admin document was replaced successfully.',
    data: { document },
  });
}

//===============================================================

export async function deleteMyAdminEmployeeDocument(
  req: Request,
  res: ValidatedResponse<unknown, AdminEmployeeDocumentParams>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);
  const { documentId } = res.locals.validated.params;

  await deleteMyAdminEmployeeDocumentService(
    userId,
    authorization,
    documentId,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}

//===============================================================

export async function listMyAdminEmployeePrivateNotes(
  req: Request,
  res: ValidatedResponse<unknown, unknown, AdminEmployeePrivateNotesQuery>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);
  const { page, perPage } = res.locals.validated.query;

  const data = await listMyAdminEmployeePrivateNotesService(
    userId,
    authorization,
    page,
    perPage
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createMyAdminEmployeePrivateNote(
  req: Request,
  res: ValidatedResponse<CreateAdminEmployeePrivateNoteInput>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);

  const note = await createMyAdminEmployeePrivateNoteService(
    userId,
    authorization,
    res.locals.validated.body
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Private comment was created successfully.',
    data: { note },
  });
}

//===============================================================

export async function deleteMyAdminEmployeePrivateNote(
  req: Request,
  res: ValidatedResponse<unknown, AdminEmployeePrivateNoteParams>
): Promise<void> {
  const { userId, authorization } = requireSelfAdminContext(req);
  const { commentId } = res.locals.validated.params;

  await deleteMyAdminEmployeePrivateNoteService(
    userId,
    authorization,
    commentId
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}
