import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';

import {
  createPharmacyUserByAdminService,
  updatePharmacyStatusByAdminService,
} from '../services/admin.service';

import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

type AdminPharmacyParams = { pharmacyId: string };

//===============================================================

export async function createPharmacyUserByAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const pharmacy = await createPharmacyUserByAdminService(
    req.body,
    adminUserId
  );
  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Pharmacy was created successfully.',
    data: { pharmacy },
  });
}

//===============================================================

export async function updatePharmacyStatusByAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const adminUserId = req.user?.id;
  if (!adminUserId) return;

  const { pharmacyId } = req.params as AdminPharmacyParams;
  const pharmacy = await updatePharmacyStatusByAdminService(
    pharmacyId,
    req.body,
    adminUserId
  );

  sendSuccessResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Pharmacy status was updated successfully.',
    data: { pharmacy },
  });
}
