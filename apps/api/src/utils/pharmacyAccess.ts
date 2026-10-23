import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { ProductOffer } from '../models/inventory/productOffer.model';
import { requirePharmacyCapability } from '../services/pharmacies/pharmacy-membership.service';
import { httpError } from './httpError';

//===============================================================

export async function assertPharmacyOwner(pharmacyId: string, userId: string) {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid id');
  }

  const { pharmacy } = await requirePharmacyCapability(
    userId,
    'manage_products',

    { pharmacyId }
  );

  return pharmacy;
}

//===============================================================

export async function assertProductOfferOwner(
  productId: string,
  pharmacyId: string,
  userId: string
) {
  await assertPharmacyOwner(pharmacyId, userId);

  if (!Types.ObjectId.isValid(productId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid id');
  }

  const productOffer = await ProductOffer.findOne({ productId, pharmacyId });

  if (!productOffer) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this product offer'
    );
  }

  return productOffer;
}
