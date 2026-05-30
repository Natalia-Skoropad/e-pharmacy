import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createVendorUserByAdminService,
  updateShopStatusByAdminService,
  updateVendorStatusByAdminService,
} from '../services/admin.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type AdminVendorParams = {
  vendorId: string;
};

type AdminShopParams = {
  shopId: string;
};

//===============================================================

export async function createVendorUserByAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const adminUserId = req.user?.id;

  if (!adminUserId) return;

  const vendor = await createVendorUserByAdminService(req.body, adminUserId);

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Vendor account was created successfully.',
    data: { vendor },
  });
}

//===============================================================

export async function updateVendorStatusByAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const adminUserId = req.user?.id;

  if (!adminUserId) return;

  const { vendorId } = req.params as AdminVendorParams;

  const vendor = await updateVendorStatusByAdminService(
    vendorId,
    req.body,
    adminUserId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Vendor status was updated successfully.',
    data: { vendor },
  });
}

//===============================================================

export async function updateShopStatusByAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const adminUserId = req.user?.id;

  if (!adminUserId) return;

  const { shopId } = req.params as AdminShopParams;

  const shop = await updateShopStatusByAdminService(
    shopId,
    req.body,
    adminUserId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Shop status was updated successfully.',
    data: { shop },
  });
}
