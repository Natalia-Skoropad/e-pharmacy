import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { httpError } from '../utils/httpError';

//===============================================================

type StockTarget = string | Types.ObjectId;

function toObjectId(value: StockTarget): Types.ObjectId {
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}

function assertPositiveQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Quantity must be a positive integer.'
    );
  }
}

//===============================================================

export async function reserveOfferStock(
  productId: StockTarget,
  storeId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await Product.updateOne(
    {
      _id: productId,
      offers: {
        $elemMatch: {
          storeId,
          activeQuantity: { $gte: quantity },
          inStock: true,
        },
      },
    },
    {
      $inc: {
        'offers.$.activeQuantity': -quantity,
        'offers.$.reservedQuantity': quantity,
      },
    },
    { session }
  );

  if (result.modifiedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product quantity is no longer available. Please refresh and try again.'
    );
  }

  await syncOfferAvailability(productId, storeId, session);
}

//===============================================================

export async function releaseOfferStock(
  productId: StockTarget,
  storeId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession,
  strict = true
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await Product.updateOne(
    {
      _id: productId,
      offers: {
        $elemMatch: {
          storeId,
          reservedQuantity: { $gte: quantity },
        },
      },
    },
    {
      $inc: {
        'offers.$.activeQuantity': quantity,
        'offers.$.reservedQuantity': -quantity,
      },
    },
    { session }
  );

  if (strict && result.modifiedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation could not be released. Please refresh and try again.'
    );
  }

  if (result.modifiedCount === 1) {
    await syncOfferAvailability(productId, storeId, session);
  }
}

//===============================================================

export async function commitReservedStock(
  productId: StockTarget,
  storeId: StockTarget,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await Product.updateOne(
    {
      _id: productId,
      offers: {
        $elemMatch: {
          storeId,
          reservedQuantity: { $gte: quantity },
          totalQuantity: { $gte: quantity },
        },
      },
    },
    {
      $inc: {
        'offers.$.reservedQuantity': -quantity,
        'offers.$.totalQuantity': -quantity,
      },
    },
    { session }
  );

  if (result.modifiedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation is no longer available. Please refresh and try again.'
    );
  }

  await syncOfferAvailability(productId, storeId, session);
}

//===============================================================

export async function setVendorOfferStock(
  productId: StockTarget,
  storeId: StockTarget,
  nextTotalQuantity: number,
  session?: mongoose.ClientSession
): Promise<void> {
  if (!Number.isInteger(nextTotalQuantity) || nextTotalQuantity < 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Stock quantity must be a non-negative integer.'
    );
  }

  const product = await Product.findOne(
    { _id: productId, 'offers.storeId': storeId },
    { 'offers.$': 1 }
  )
    .session(session ?? null)
    .lean<{ offers?: Array<{ reservedQuantity: number }> } | null>();

  const reservedQuantity = product?.offers?.[0]?.reservedQuantity;

  if (reservedQuantity === undefined) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  if (nextTotalQuantity < reservedQuantity) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Stock cannot be lower than the quantity already reserved in client carts.'
    );
  }

  const nextActiveQuantity = nextTotalQuantity - reservedQuantity;

  const result = await Product.updateOne(
    { _id: productId, 'offers.storeId': storeId },
    {
      $set: {
        'offers.$.totalQuantity': nextTotalQuantity,
        'offers.$.activeQuantity': nextActiveQuantity,
        'offers.$.inStock': nextActiveQuantity > 0,
      },
    },
    { session }
  );

  if (result.modifiedCount !== 1) {
    throw httpError(HTTP_STATUS.CONFLICT, 'Product stock was not updated.');
  }
}

//===============================================================

export async function syncOfferAvailability(
  productId: StockTarget,
  storeId: StockTarget,
  session?: mongoose.ClientSession
): Promise<void> {
  const productObjectId = toObjectId(productId);
  const storeObjectId = toObjectId(storeId);

  const product = await Product.findOne(
    { _id: productObjectId, 'offers.storeId': storeObjectId },
    { 'offers.$': 1 }
  )
    .session(session ?? null)
    .lean<{ offers?: Array<{ activeQuantity: number }> } | null>();

  const activeQuantity = product?.offers?.[0]?.activeQuantity;
  if (activeQuantity === undefined) return;

  await Product.updateOne(
    { _id: productObjectId, 'offers.storeId': storeObjectId },
    { $set: { 'offers.$.inStock': activeQuantity > 0 } },
    { session }
  );
}
