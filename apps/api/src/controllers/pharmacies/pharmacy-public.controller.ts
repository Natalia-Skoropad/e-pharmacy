import type { Request } from 'express';
import { USER_ROLES } from '../../constants/auth/auth';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import type {
  PharmaciesQuery,
  PharmacyIdParams,
} from '../../schemas/pharmacies/pharmacy.schema';

import {
  getFavoritePharmacyIdsService,
  getFavoritePharmaciesService,
  getPharmaciesService,
  getPharmacyCheckoutDetailsService,
  getPharmacyDetailsService,
  getPharmacyFiltersService,
  getPharmacyOptionsService,
  setFavoritePharmacyService,
} from '../../services/pharmacies/pharmacy-public-catalog.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function getPharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmaciesQuery>
): Promise<void> {
  const { query } = res.locals.validated;

  const data = await getPharmaciesService(
    query,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyFilters(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPharmacyFiltersService();

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyOptions(
  _req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getPharmacyOptionsService();

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoritePharmacyIds(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getFavoritePharmacyIdsService(req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getFavoritePharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, PharmaciesQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getFavoritePharmaciesService(query, req.user?.id ?? '');

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyDetails(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;

  const data = await getPharmacyDetailsService(
    pharmacyId,
    req.user?.role === USER_ROLES.CLIENT ? req.user.id : undefined
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getPharmacyCheckoutDetails(
  _req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;
  const data = await getPharmacyCheckoutDetailsService(pharmacyId);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function setFavoritePharmacy(
  req: Request,
  res: ValidatedResponse<unknown, PharmacyIdParams>
): Promise<void> {
  const { pharmacyId } = res.locals.validated.params;

  const data = await setFavoritePharmacyService(
    pharmacyId,
    req.user?.id ?? '',
    req.method === 'PUT'
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
