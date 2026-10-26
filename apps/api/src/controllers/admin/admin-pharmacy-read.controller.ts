import type { Request } from 'express';

import { documentAttachmentDisposition } from '../shared/document-attachment';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  AdminPharmacyDocumentParams,
  AdminPharmacyParams,
} from '../../schemas/admin/admin.schema';

import type {
  AdminPharmacyRegistryListQuery,
  AdminPharmacyRegistryOptionsQuery,
} from '../../schemas/admin/pharmacies/admin-pharmacy-registry.schema';

import {
  listAdminPharmaciesService,
  getAdminPharmacyStatisticsService,
  listAdminPharmacyOptionsService,
  listAdminPharmacyRegistryOwnerOptionsService,
} from '../../services/admin/pharmacies/admin-pharmacy-registry-read.service';

import {
  getAdminPharmacyDetailService,
  getAdminPharmacySalesStatisticsService,
} from '../../services/admin/pharmacies/admin-pharmacy-detail-read.service';

import type { OrderSalesStatisticsQuery } from '../../schemas/orders/order.schema';

import {
  downloadAdminPharmacyDocumentService,
  listAdminPharmacyDocumentsService,
} from '../../services/pharmacies/pharmacy-document.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function getAdminPharmacyDocument(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyDocumentParams>
): Promise<void> {
  const { pharmacyId, documentId } = res.locals.validated.params;

  const { document, content } = await downloadAdminPharmacyDocumentService(
    pharmacyId,
    documentId
  );

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

//===============================================================

export async function listPharmacyDocumentsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams>
): Promise<void> {
  const documents = await listAdminPharmacyDocumentsService(
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data: { documents } });
}

//===============================================================

export async function listPharmaciesByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyRegistryListQuery>
): Promise<void> {
  const data = await listAdminPharmaciesService(res.locals.validated.query);

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyRegistryStatisticsByAdmin(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getAdminPharmacyStatisticsService();

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyRegistryOptionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyRegistryOptionsQuery>
): Promise<void> {
  const data = await listAdminPharmacyOptionsService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyRegistryOwnerOptionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyRegistryOptionsQuery>
): Promise<void> {
  const data = await listAdminPharmacyRegistryOwnerOptionsService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacySalesStatisticsByAdmin(
  _req: Request,

  res: ValidatedResponse<
    unknown,
    AdminPharmacyParams,
    OrderSalesStatisticsQuery
  >
): Promise<void> {
  const data = await getAdminPharmacySalesStatisticsService(
    res.locals.validated.params.pharmacyId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyDetailByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyParams>
): Promise<void> {
  const data = await getAdminPharmacyDetailService(
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
