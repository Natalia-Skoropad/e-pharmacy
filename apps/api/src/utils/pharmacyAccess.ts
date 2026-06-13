import { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';
import { httpError } from './httpError';

//===============================================================

export async function assertStoreOwner(storeId: string, userId: string) {
  if (!Types.ObjectId.isValid(storeId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid id');
  }

  const store = await Store.findOne({ _id: storeId, ownerId: userId });

  if (!store) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this store'
    );
  }

  return store;
}

//===============================================================

export async function assertProductOfferOwner(
  productId: string,
  storeId: string,
  userId: string
) {
  await assertStoreOwner(storeId, userId);

  if (!Types.ObjectId.isValid(productId)) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid id');
  }

  const product = await Product.findOne({
    _id: productId,
    'offers.storeId': storeId,
  });

  if (!product) {
    throw httpError(
      HTTP_STATUS.FORBIDDEN,
      'You do not have access to this product offer'
    );
  }

  return product;
}
