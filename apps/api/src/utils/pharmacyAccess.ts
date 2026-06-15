import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { Pharmacy } from '../models/pharmacy.model';
import { httpError } from './httpError';

//===============================================================

export async function assertPharmacyOwner(pharmacyId: string, userId: string) {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid id');
  }

  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, ownerId: userId });

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

  const product = await Product.findOne({
    _id: productId,
    'offers.pharmacyId': pharmacyId,
  });

  if (!product) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this product offer'
    );
  }

  return product;
}
