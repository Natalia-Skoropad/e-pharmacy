import { Types } from 'mongoose';

import { USER_ROLES } from '../../../constants/auth/auth';
import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { User } from '../../../models/accounts/user.model';

import type { OrderSalesStatisticsQuery } from '../../../schemas/order.schema';
import { httpError } from '../../../utils/httpError';

import { getOrderSalesStatisticsForPharmaciesService } from '../../orders/order-sales-statistics.service';

//===============================================================

export async function getAdminPharmacyOwnerSalesStatisticsService(
  ownerId: string,
  query: OrderSalesStatisticsQuery
) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const exists = await User.exists({
    _id: ownerObjectId,
    role: USER_ROLES.PHARMACY,
  });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');

  const pharmacies = await Pharmacy.find({ ownerId: ownerObjectId })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  return getOrderSalesStatisticsForPharmaciesService(
    pharmacies.map((item) => String(item._id)),
    query
  );
}
