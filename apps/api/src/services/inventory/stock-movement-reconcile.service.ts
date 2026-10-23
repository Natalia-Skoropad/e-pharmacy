import mongoose from 'mongoose';

import { HTTP_STATUS } from '../../constants/httpStatus';

import { Order } from '../../models/orders/order.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import { httpError } from '../../utils/httpError';
import { assertStockBalance } from './stock-movement-balance';

import type {
  CurrentOrderSnapshot,
  StockOfferSnapshot,
} from './stock-movement-types';

//===============================================================

type ActiveOrderReservationSnapshot = Pick<CurrentOrderSnapshot, 'items'>;

//===============================================================

export async function reconcileOfferReservationBalance(
  offer: StockOfferSnapshot,
  session: mongoose.ClientSession
): Promise<StockOfferSnapshot> {
  const activeOrders = await Order.find({
    pharmacyId: offer.pharmacyId,
    status: { $in: ['new', 'in_progress'] },
    'items.productOfferId': offer._id,
  })
    .select('items.productOfferId items.quantity')
    .session(session)
    .lean<ActiveOrderReservationSnapshot[]>();

  const reservedQuantity = activeOrders.reduce(
    (ordersTotal, order) =>
      ordersTotal +
      order.items.reduce(
        (orderTotal, item) =>
          String(item.productOfferId) === String(offer._id)
            ? orderTotal + item.quantity
            : orderTotal,
        0
      ),
    0
  );

  if (reservedQuantity > offer.totalQuantity) {
    return offer;
  }

  const availableQuantity = offer.totalQuantity - reservedQuantity;

  assertStockBalance({
    stockQuantity: offer.totalQuantity,
    reservedQuantity,
    availableQuantity,
  });

  if (
    offer.reservedQuantity === reservedQuantity &&
    offer.availableQuantity === availableQuantity
  ) {
    return offer;
  }

  const reconciledOffer = await ProductOffer.findByIdAndUpdate(
    offer._id,
    {
      $set: {
        reservedQuantity,
        availableQuantity,
      },
    },

    { returnDocument: 'after', runValidators: true, session }
  ).lean<StockOfferSnapshot | null>();

  if (!reconciledOffer) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Product offer was not found.');
  }

  return reconciledOffer;
}
