import type { Request } from 'express';

import { documentAttachmentDisposition } from '../shared/document-attachment';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type { AdminPharmacyOwnerParams } from '../../schemas/admin/owners/admin-pharmacy-owner.schema';
import type { AdminPharmacyOwnerDocumentParams } from '../../schemas/owners/pharmacy-owner-document.schema';

import {
  getPharmacyOwnerDocumentContentService,
  listPharmacyOwnerDocumentsService,
} from '../../services/owners/pharmacy-owner-document.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function listPharmacyOwnerDocumentsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerParams>
): Promise<void> {
  const documents = await listPharmacyOwnerDocumentsService(
    res.locals.validated.params.ownerId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { documents },
  });
}

//===============================================================

export async function downloadPharmacyOwnerDocumentByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerDocumentParams>
): Promise<void> {
  const { ownerId, documentId } = res.locals.validated.params;

  const { document, content } = await getPharmacyOwnerDocumentContentService(
    ownerId,
    documentId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));

  res.setHeader(
    'Content-Disposition',
    documentAttachmentDisposition(document.name)
  );

  res.status(HTTP_STATUS.OK).send(content);
}
