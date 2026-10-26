import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import type {
  AdminPharmacyOwnerListQuery,
  AdminPharmacyOwnerOptionsQuery,
  AdminPharmacyOwnerParams,
  AdminPharmacyOwnerPharmaciesQuery,
} from '../../schemas/admin/owners/admin-pharmacy-owner.schema';

import { getAdminPharmacyOwnerDetailService } from '../../services/admin/owners/admin-pharmacy-owner-detail.service';
import { getAdminPharmacyOwnerSalesStatisticsService } from '../../services/admin/owners/admin-pharmacy-owner-sales.service';
import { listAdminPharmacyOwnerSessionsService } from '../../services/admin/owners/admin-pharmacy-owner-sessions.service';

import {
  getAdminPharmacyOwnerStatisticsService,
  listAdminPharmacyOwnerOptionsService,
  listAdminPharmacyOwnersService,
} from '../../services/admin/owners/admin-pharmacy-owner-registry.service';

import { listAdminPharmacyOwnerPharmaciesService } from '../../services/admin/owners/admin-pharmacy-owner-pharmacies.service';

import type { OrderSalesStatisticsQuery } from '../../schemas/orders/order.schema';
import type { ValidatedResponse } from '../../types/http/validated-request';

import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function getPharmacyOwnerSessionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerParams>
): Promise<void> {
  const data = await listAdminPharmacyOwnerSessionsService(
    res.locals.validated.params.ownerId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOwnerSalesStatisticsByAdmin(
  _req: Request,
  res: ValidatedResponse<
    unknown,
    AdminPharmacyOwnerParams,
    OrderSalesStatisticsQuery
  >
): Promise<void> {
  const data = await getAdminPharmacyOwnerSalesStatisticsService(
    res.locals.validated.params.ownerId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnersByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyOwnerListQuery>
): Promise<void> {
  const data = await listAdminPharmacyOwnersService(res.locals.validated.query);

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOwnerSummaryByAdmin(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getAdminPharmacyOwnerStatisticsService();

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnerOptionsByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminPharmacyOwnerOptionsQuery>
): Promise<void> {
  const data = await listAdminPharmacyOwnerOptionsService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOwnerDetailByAdmin(
  _req: Request,
  res: ValidatedResponse<unknown, AdminPharmacyOwnerParams>
): Promise<void> {
  const data = await getAdminPharmacyOwnerDetailService(
    res.locals.validated.params.ownerId
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listPharmacyOwnerPharmaciesByAdmin(
  _req: Request,

  res: ValidatedResponse<
    unknown,
    AdminPharmacyOwnerParams,
    AdminPharmacyOwnerPharmaciesQuery
  >
): Promise<void> {
  const data = await listAdminPharmacyOwnerPharmaciesService(
    res.locals.validated.params.ownerId,
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
