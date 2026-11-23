import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type { ValidatedResponse } from '../../types/http/validated-request';

import type {
  ProductRequestDocumentUploadInput,
  ProductRequestDocumentParams,
} from '../../schemas/catalog/product-request-document.schema';

import { sendSuccessResponse } from '../../utils/http/apiResponse';

import { documentAttachmentDisposition } from '../shared/document-attachment';

import {
  uploadProductRequestDocumentService,
  downloadProductRequestDocumentService,
  downloadProductRequestDocumentByAdminService,
} from '../../services/catalog/product-request-document.service';

//=================================================================================

export async function uploadProductRequestDocument(
  req: Request,
  res: ValidatedResponse<ProductRequestDocumentUploadInput>
): Promise<void> {
  const data = await uploadProductRequestDocumentService(
    req.user?.id ?? '',
    res.locals.validated.body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//=================================================================================

function sendDocument(
  res: Response,
  document: { name: string; type: string },
  content: Buffer
): void {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', document.type);
  res.setHeader('Content-Length', String(content.byteLength));
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader(
    'Content-Disposition',
    documentAttachmentDisposition(document.name)
  );

  res.status(HTTP_STATUS.OK).send(content);
}

//=================================================================================

export async function downloadProductRequestDocument(
  req: Request,
  res: ValidatedResponse<unknown, ProductRequestDocumentParams>
): Promise<void> {
  const { requestId, documentId } = res.locals.validated.params;

  const file = await downloadProductRequestDocumentService(
    req.user?.id ?? '',
    requestId,
    documentId
  );

  sendDocument(res, file.document, file.content);
}

//=================================================================================

export async function downloadProductRequestDocumentByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, ProductRequestDocumentParams>
): Promise<void> {
  const { requestId, documentId } = res.locals.validated.params;

  const file = await downloadProductRequestDocumentByAdminService(
    requestId,
    documentId
  );

  sendDocument(res, file.document, file.content);
}
