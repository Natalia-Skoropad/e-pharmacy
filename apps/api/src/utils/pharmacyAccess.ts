import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { ProductOffer } from '../models/productOffer.model';
import { Pharmacy } from '../models/pharmacy.model';
import { httpError } from './httpError';

//===============================================================

export async function assertPharmacyOwner(pharmacyId: string, userId: string) {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid id');
  }

  const pharmacy = await Pharmacy.findOne({
    _id: pharmacyId,
    $or: [{ ownerId: userId }, { managerUserIds: userId }],
  });

  if (!pharmacy) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this pharmacy'
    );
  }

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
