import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { ProductOffer } from '../models/productOffer.model';
import { httpError } from '../utils/httpError';

//===============================================================

type StockTarget = string | Types.ObjectId;

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
  productOfferId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await ProductOffer.updateOne(
    { _id: productOfferId, availableQuantity: { $gte: quantity } },
    { $inc: { availableQuantity: -quantity, reservedQuantity: quantity } },
    { session, runValidators: true }
  );

  if (result.modifiedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product quantity is no longer available. Please refresh and try again.'
    );
  }
}

//===============================================================

export async function releaseOfferStock(
  productOfferId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession,
  strict = true
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await ProductOffer.updateOne(
    { _id: productOfferId, reservedQuantity: { $gte: quantity } },
    { $inc: { availableQuantity: quantity, reservedQuantity: -quantity } },
    { session, runValidators: true }
  );

  if (strict && result.modifiedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation could not be released. Please refresh and try again.'
    );
  }
}

//===============================================================

export async function commitReservedStock(
  productOfferId: StockTarget,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  const result = await ProductOffer.updateOne(
    {
      _id: productOfferId,
      reservedQuantity: { $gte: quantity },
      totalQuantity: { $gte: quantity },
    },
    { $inc: { reservedQuantity: -quantity, totalQuantity: -quantity } },
    { session, runValidators: true }
  );

  if (result.modifiedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation is no longer available. Please refresh and try again.'
    );
  }
}

//===============================================================

export async function restoreCommittedStock(
  productOfferId: StockTarget,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  assertPositiveQuantity(quantity);

  await ProductOffer.updateOne(
    { _id: productOfferId },
    { $inc: { totalQuantity: quantity, availableQuantity: quantity } },
    { session, runValidators: true }
  );
}

//===============================================================

export async function setPharmacyOfferStock(
  productOfferId: StockTarget,
  nextTotalQuantity: number,
  session?: mongoose.ClientSession
): Promise<void> {
  if (!Number.isInteger(nextTotalQuantity) || nextTotalQuantity < 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Stock quantity must be a non-negative integer.'
    );
  }

  const offer = await ProductOffer.findById(productOfferId)
    .session(session ?? null)
    .lean();

  if (!offer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }
  if (nextTotalQuantity < offer.reservedQuantity) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Stock cannot be lower than the quantity already reserved in client carts.'
    );
  }

  await ProductOffer.updateOne(
    { _id: offer._id },
    {
      $set: {
        totalQuantity: nextTotalQuantity,
        availableQuantity: nextTotalQuantity - offer.reservedQuantity,
      },
    },
    { session, runValidators: true }
  );
}
