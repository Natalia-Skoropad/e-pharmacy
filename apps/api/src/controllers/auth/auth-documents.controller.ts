import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import {
  createRegistrationPharmacyDocumentUploadService,
  createRegistrationPharmacyDocumentUploadSessionService,
} from '../../services/pharmacies/pharmacy-document.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import type { PharmacyRegistrationDocumentUploadInput } from '../../schemas/shared/pharmacy-document.schema';

import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function createRegistrationPharmacyDocumentUploadSession(
  _req: Request,
  res: Response
): Promise<void> {
  const data = await createRegistrationPharmacyDocumentUploadSessionService();

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}

//===============================================================

export async function uploadRegistrationPharmacyDocument(
  _req: Request,
  res: ValidatedResponse<PharmacyRegistrationDocumentUploadInput>
): Promise<void> {
  const input = res.locals.validated.body;
  const data = await createRegistrationPharmacyDocumentUploadService(input);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    data,
  });
}
