import mongoose, { Types } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import { STOCK_CHANGED_ERROR_CODE } from '../constants/stock';
import { ProductOffer } from '../models/productOffer.model';

import {
  recordStockMovement,
  type StockMovementContext,
} from './stockMovement.service';

import { httpError } from '../utils/httpError';

//===============================================================

type StockTarget = string | Types.ObjectId;

//===============================================================

type StockOfferSnapshot = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
};

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

async function recordMovementIfNeeded(
  offer: StockOfferSnapshot,
  input: {
    eventType: 'arrival' | 'reserve' | 'release' | 'write_off' | 'adjustment';
    stockDelta: number;
    reservedDelta: number;
    availableDelta: number;
  },
  context?: StockMovementContext,
  session?: mongoose.ClientSession
): Promise<void> {
  if (!context) return;

  await recordStockMovement({
    offer,
    ...input,
    context,
    session,
  });
}

//===============================================================

export async function reserveOfferStock(
  productOfferId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession,
  context?: StockMovementContext
): Promise<void> {
  assertPositiveQuantity(quantity);

  const offer = await ProductOffer.findOneAndUpdate(
    { _id: productOfferId, availableQuantity: { $gte: quantity } },
    { $inc: { availableQuantity: -quantity, reservedQuantity: quantity } },
    { returnDocument: 'after', session, runValidators: true }
  ).lean<StockOfferSnapshot | null>();

  if (!offer) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Available quantity has changed. Please refresh and try again.',
      undefined,
      STOCK_CHANGED_ERROR_CODE
    );
  }

  await recordMovementIfNeeded(
    offer,
    {
      eventType: 'reserve',
      stockDelta: 0,
      reservedDelta: quantity,
      availableDelta: -quantity,
    },
    context,
    session
  );
}

//===============================================================

export async function releaseOfferStock(
  productOfferId: StockTarget,
  quantity: number,
  session?: mongoose.ClientSession,
  strict = true,
  context?: StockMovementContext
): Promise<void> {
  assertPositiveQuantity(quantity);

  const offer = await ProductOffer.findOneAndUpdate(
    { _id: productOfferId, reservedQuantity: { $gte: quantity } },
    { $inc: { availableQuantity: quantity, reservedQuantity: -quantity } },
    { returnDocument: 'after', session, runValidators: true }
  ).lean<StockOfferSnapshot | null>();

  if (!offer) {
    if (!strict) return;

    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation could not be released. Please refresh and try again.',
      undefined,
      STOCK_CHANGED_ERROR_CODE
    );
  }

  await recordMovementIfNeeded(
    offer,
    {
      eventType: 'release',
      stockDelta: 0,
      reservedDelta: -quantity,
      availableDelta: quantity,
    },
    context,
    session
  );
}

//===============================================================

export async function commitReservedStock(
  productOfferId: StockTarget,
  quantity: number,
  session: mongoose.ClientSession,
  context?: StockMovementContext
): Promise<void> {
  assertPositiveQuantity(quantity);

  const offer = await ProductOffer.findOneAndUpdate(
    {
      _id: productOfferId,
      reservedQuantity: { $gte: quantity },
      totalQuantity: { $gte: quantity },
    },
    { $inc: { reservedQuantity: -quantity, totalQuantity: -quantity } },
    { returnDocument: 'after', session, runValidators: true }
  ).lean<StockOfferSnapshot | null>();

  if (!offer) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Product reservation is no longer available. Please refresh and try again.',
      undefined,
      STOCK_CHANGED_ERROR_CODE
    );
  }

  await recordMovementIfNeeded(
    offer,
    {
      eventType: 'write_off',
      stockDelta: -quantity,
      reservedDelta: -quantity,
      availableDelta: 0,
    },
    context,
    session
  );
}

//===============================================================

export async function restoreCommittedStock(
  productOfferId: StockTarget,
  quantity: number,
  session: mongoose.ClientSession,
  context?: StockMovementContext
): Promise<void> {
  assertPositiveQuantity(quantity);

  const offer = await ProductOffer.findOneAndUpdate(
    { _id: productOfferId },
    { $inc: { totalQuantity: quantity, availableQuantity: quantity } },
    { returnDocument: 'after', session, runValidators: true }
  ).lean<StockOfferSnapshot | null>();

  if (!offer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  await recordMovementIfNeeded(
    offer,
    {
      eventType: 'adjustment',
      stockDelta: quantity,
      reservedDelta: 0,
      availableDelta: quantity,
    },
    context,
    session
  );
}

//===============================================================

export async function setPharmacyOfferStock(
  productOfferId: StockTarget,
  nextTotalQuantity: number,
  session?: mongoose.ClientSession,
  context?: StockMovementContext
): Promise<void> {
  if (!Number.isInteger(nextTotalQuantity) || nextTotalQuantity < 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Stock quantity must be a non-negative integer.'
    );
  }

  const currentOffer = await ProductOffer.findById(productOfferId)
    .session(session ?? null)
    .lean<StockOfferSnapshot | null>();

  if (!currentOffer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  if (nextTotalQuantity < currentOffer.reservedQuantity) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Stock cannot be lower than the quantity already reserved in client orders.',
      undefined,
      STOCK_CHANGED_ERROR_CODE
    );
  }

  const stockDelta = nextTotalQuantity - currentOffer.totalQuantity;

  if (stockDelta === 0) return;

  const offer = await ProductOffer.findByIdAndUpdate(
    currentOffer._id,
    {
      $set: {
        totalQuantity: nextTotalQuantity,
        availableQuantity: nextTotalQuantity - currentOffer.reservedQuantity,
      },
    },
    { returnDocument: 'after', session, runValidators: true }
  ).lean<StockOfferSnapshot | null>();

  if (!offer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  await recordMovementIfNeeded(
    offer,
    {
      eventType: stockDelta > 0 ? 'arrival' : 'adjustment',
      stockDelta,
      reservedDelta: 0,
      availableDelta: stockDelta,
    },
    context,
    session
  );
}
