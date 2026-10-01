import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  AdminPositionParams,
  AdminProductCategoryParams,
  AdminSettingsDictionaryListQuery,
  CreateAdminProductCategoryInput,
  CreateAdminSettingsDictionaryItemInput,
  UpdateAdminProductCategoryInput,
  UpdateAdminSettingsDictionaryItemInput,
} from '../schemas/admin-settings.schema';

import {
  createAdminPositionService,
  createAdminProductCategoryService,
  deleteAdminPositionService,
  deleteAdminProductCategoryService,
  listAdminPositionsService,
  listAdminProductCategoriesService,
  updateAdminPositionService,
  updateAdminProductCategoryService,
} from '../services/admin-settings.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

function requireAdminUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw new Error('Authenticated admin user is missing.');
  return userId;
}

//===============================================================

export async function listAdminProductCategories(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminSettingsDictionaryListQuery>
): Promise<void> {
  const data = await listAdminProductCategoriesService(
    res.locals.validated.query
  );

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createAdminProductCategory(
  req: Request,
  res: ValidatedResponse<CreateAdminProductCategoryInput>
): Promise<void> {
  const category = await createAdminProductCategoryService(
    res.locals.validated.body,
    requireAdminUserId(req),
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Product category was created successfully.',
    data: { category },
  });
}

//===============================================================

export async function updateAdminProductCategory(
  req: Request,
  res: ValidatedResponse<
    UpdateAdminProductCategoryInput,
    AdminProductCategoryParams
  >
): Promise<void> {
  const category = await updateAdminProductCategoryService(
    res.locals.validated.params.categoryId,
    res.locals.validated.body,
    requireAdminUserId(req),
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Product category was updated successfully.',
    data: { category },
  });
}

//===============================================================

export async function deleteAdminProductCategory(
  req: Request,
  res: ValidatedResponse<unknown, AdminProductCategoryParams>
): Promise<void> {
  await deleteAdminProductCategoryService(
    res.locals.validated.params.categoryId,
    requireAdminUserId(req),
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}

//===============================================================

export async function listAdminPositions(
  _req: Request,
  res: ValidatedResponse<unknown, unknown, AdminSettingsDictionaryListQuery>
): Promise<void> {
  const data = await listAdminPositionsService(res.locals.validated.query);

  res.setHeader('Cache-Control', 'no-store');
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createAdminPosition(
  req: Request,
  res: ValidatedResponse<CreateAdminSettingsDictionaryItemInput>
): Promise<void> {
  const position = await createAdminPositionService(
    res.locals.validated.body,
    requireAdminUserId(req),
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Position was created successfully.',
    data: { position },
  });
}

//===============================================================

export async function updateAdminPosition(
  req: Request,
  res: ValidatedResponse<
    UpdateAdminSettingsDictionaryItemInput,
    AdminPositionParams
  >
): Promise<void> {
  const position = await updateAdminPositionService(
    res.locals.validated.params.positionId,
    res.locals.validated.body,
    requireAdminUserId(req),
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Position was updated successfully.',
    data: { position },
  });
}

//===============================================================

export async function deleteAdminPosition(
  req: Request,
  res: ValidatedResponse<unknown, AdminPositionParams>
): Promise<void> {
  await deleteAdminPositionService(
    res.locals.validated.params.positionId,
    requireAdminUserId(req),
    res.locals.requestId
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(HTTP_STATUS.NO_CONTENT).end();
}
