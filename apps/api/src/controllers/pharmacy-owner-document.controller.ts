import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  PharmacyOwnerDocumentParams,
  PharmacyOwnerDocumentUploadInput,
} from '../schemas/pharmacy-owner-document.schema';

import {
  createPharmacyOwnerDocumentService,
  deletePharmacyOwnerDocumentService,
  getPharmacyOwnerDocumentContentService,
  listPharmacyOwnerDocumentsService,
} from '../services/pharmacy-owner-document.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

function encodeContentDispositionFilename(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

//===============================================================

export async function listMyPharmacyOwnerDocuments(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const documents = await listPharmacyOwnerDocumentsService(req.user?.id ?? '');

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    data: { documents },
  });
}

//===============================================================

export async function downloadMyPharmacyOwnerDocument(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyOwnerDocumentParams>
): Promise<void> {
  const { documentId } = res.locals.validated.params;

  const { document, content } = await getPharmacyOwnerDocumentContentService(
    req.user?.id ?? '',
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

export async function uploadMyPharmacyOwnerDocument(
  req: Request,
  res: ValidatedResponse<PharmacyOwnerDocumentUploadInput>
): Promise<void> {
  const document = await createPharmacyOwnerDocumentService(
    req.user?.id ?? '',
    res.locals.validated.body,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Owner document was uploaded successfully.',
    data: { document },
  });
}

//===============================================================

export async function deleteMyPharmacyOwnerDocument(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyOwnerDocumentParams>
): Promise<void> {
  await deletePharmacyOwnerDocumentService(
    req.user?.id ?? '',
    res.locals.validated.params.documentId,
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'private, no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Owner document was deleted successfully.',
  });
}
