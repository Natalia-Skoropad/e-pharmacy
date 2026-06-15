import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { ProductOffer } from '../models/productOffer.model';
import { httpError } from '../utils/httpError';

//===============================================================

type StockTarget = string | Types.ObjectId;

//===============================================================

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
  pharmacyId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await ProductOffer.updateOne(
    {
      productId,
      pharmacyId,
      activeQuantity: { $gte: quantity },
      inStock: true,
    },
    { $inc: { activeQuantity: -quantity, reservedQuantity: quantity } },
    { session }
  );

  if (result.modifiedCount !== 1)
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product quantity is no longer available. Please refresh and try again.'
    );

  await syncOfferAvailability(productId, pharmacyId, session);
}

//===============================================================

export async function releaseOfferStock(
  productId: StockTarget,
  pharmacyId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession,
  strict = true
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await ProductOffer.updateOne(
    { productId, pharmacyId, reservedQuantity: { $gte: quantity } },
    { $inc: { activeQuantity: quantity, reservedQuantity: -quantity } },
    { session }
  );

  if (strict && result.modifiedCount !== 1)
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation could not be released. Please refresh and try again.'
    );

  if (result.modifiedCount === 1)
    await syncOfferAvailability(productId, pharmacyId, session);
}

//===============================================================

export async function commitReservedStock(
  productId: StockTarget,
  pharmacyId: StockTarget,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await ProductOffer.updateOne(
    {
      productId,
      pharmacyId,
      reservedQuantity: { $gte: quantity },
      totalQuantity: { $gte: quantity },
    },
    { $inc: { reservedQuantity: -quantity, totalQuantity: -quantity } },
    { session }
  );

  if (result.modifiedCount !== 1)
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation is no longer available. Please refresh and try again.'
    );

  await syncOfferAvailability(productId, pharmacyId, session);
}

//===============================================================

export async function setPharmacyOfferStock(
  productId: StockTarget,
  pharmacyId: StockTarget,
  nextTotalQuantity: number,
  session?: mongoose.ClientSession
): Promise<void> {
  if (!Number.isInteger(nextTotalQuantity) || nextTotalQuantity < 0)
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Stock quantity must be a non-negative integer.'
    );

  const offer = await ProductOffer.findOne({ productId, pharmacyId })
    .session(session ?? null)
    .lean();
  if (!offer)
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  if (nextTotalQuantity < offer.reservedQuantity)
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Stock cannot be lower than the quantity already reserved in client carts.'
    );

  const activeQuantity = nextTotalQuantity - offer.reservedQuantity;
  await ProductOffer.updateOne(
    { _id: offer._id },
    {
      $set: {
        totalQuantity: nextTotalQuantity,
        activeQuantity,
        inStock: activeQuantity > 0,
      },
    },
    { session }
  );
}

//===============================================================

export async function syncOfferAvailability(
  productId: StockTarget,
  pharmacyId: StockTarget,
  session?: mongoose.ClientSession
): Promise<void> {
  const offer = await ProductOffer.findOne({ productId, pharmacyId })
    .session(session ?? null)
    .lean();
  if (!offer) return;

  await ProductOffer.updateOne(
    { _id: offer._id },
    { $set: { inStock: offer.activeQuantity > 0 } },
    { session }
  );
}
