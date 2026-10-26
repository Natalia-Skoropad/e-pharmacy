import type { Request } from 'express';

import { HTTP_STATUS } from '../../constants/http/httpStatus';

import type {
  OwnedPharmacyRegistryListQuery,
  OwnedPharmacyRegistryOptionsQuery,
  OwnedPharmacyRegistryParams,
} from '../../schemas/owners/owned-pharmacy-registry.schema';

import {
  getOwnedPharmacyDetailService,
  getOwnedPharmacyStatisticsService,
  listOwnedPharmaciesService,
  listOwnedPharmacyOptionsService,
} from '../../services/pharmacies/owned-pharmacy-registry-read.service';

import type { ValidatedResponse } from '../../types/http/validated-request';
import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===============================================================

// Domain controller handlers; imported directly by routes.

export async function listOwnedPharmacies(
  req: Request,
  res: ValidatedResponse<unknown, unknown, OwnedPharmacyRegistryListQuery>
): Promise<void> {
  const data = await listOwnedPharmaciesService(
    req.user?.id ?? '',
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacyStatistics(
  req: Request,
  res: ValidatedResponse
): Promise<void> {
  const data = await getOwnedPharmacyStatisticsService(req.user?.id ?? '');

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function listOwnedPharmacyOptions(
  req: Request,
  res: ValidatedResponse<unknown, unknown, OwnedPharmacyRegistryOptionsQuery>
): Promise<void> {
  const data = await listOwnedPharmacyOptionsService(
    req.user?.id ?? '',
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOwnedPharmacyDetail(
  req: Request,
  res: ValidatedResponse<unknown, OwnedPharmacyRegistryParams>
): Promise<void> {
  const data = await getOwnedPharmacyDetailService(
    req.user?.id ?? '',
    res.locals.validated.params.pharmacyId
  );

  res.setHeader('Cache-Control', 'private, no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
