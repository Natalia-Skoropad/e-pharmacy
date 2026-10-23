import mongoose, { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth';
import { HTTP_STATUS } from '../../constants/httpStatus';
import { PRODUCT_MANAGEMENT_ERROR_CODES } from '../../constants/product-management';
import { API_MESSAGES } from '../../constants/messages';

import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { Order } from '../../models/orders/order.model';

import type { ManagedProductsQuery } from '../../schemas/product.schema';

import { recordInitialStockArrival } from '../inventory/stock-movement-write.service';

import { httpError } from '../../utils/httpError';
import { isDuplicateProductOfferError } from '../../utils/mongoError';

import { getProductsByScope, getProductDetailsByScope } from './product-shared';

import type { ProductManagementActor } from './product-management-access';

import {
  getCurrentUserPharmacyForManagedProductRead,
  getManagedProductOfferVisibility,
  resolveManagedProductsAccess,
  getCurrentUserPharmacyForProductManagement,
} from './product-management-access';

//===============================================================

export async function getManagedProductStatisticsService(
  actor: ProductManagementActor
) {
  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');
  }

  const pharmacy = await getCurrentUserPharmacyForManagedProductRead(
    actor.userId
  );

  const pharmacyId = pharmacy._id;

  const [statistics] = await Product.aggregate<{
    active: number;
    blocked: number;
    addedToPharmacy: number;
    notAddedToPharmacy: number;
  }>([
    { $match: { status: { $in: ['active', 'blocked'] } } },

    {
      $lookup: {
        from: ProductOffer.collection.name,
        let: { productId: '$_id' },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$productId', '$$productId'] },
                  { $eq: ['$pharmacyId', pharmacyId] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],

        as: 'currentPharmacyOffers',
      },
    },

    {
      $group: {
        _id: null,
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },

        blocked: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
        },

        addedToPharmacy: {
          $sum: {
            $cond: [{ $gt: [{ $size: '$currentPharmacyOffers' }, 0] }, 1, 0],
          },
        },

        notAddedToPharmacy: {
          $sum: {
            $cond: [{ $eq: [{ $size: '$currentPharmacyOffers' }, 0] }, 1, 0],
          },
        },
      },
    },

    { $project: { _id: 0 } },
  ]);

  return (
    statistics ?? {
      active: 0,
      blocked: 0,
      addedToPharmacy: 0,
      notAddedToPharmacy: 0,
    }
  );
}

//===============================================================

export async function getManagedProductsService(
  query: ManagedProductsQuery,
  actor: ProductManagementActor,
  options: Readonly<{ includeOffers?: boolean }> = {}
) {
  const access = await resolveManagedProductsAccess(query, actor);

  return getProductsByScope(access.query, 'management', undefined, {
    ...options,
    offerVisibility: access.offerVisibility,
  });
}

//===============================================================

export async function getManagedProductDetailsService(
  productId: string,
  actor: ProductManagementActor
) {
  const offerVisibility = await getManagedProductOfferVisibility(actor);

  return getProductDetailsByScope(
    productId,
    undefined,
    'management',
    offerVisibility
  );
}

//===============================================================

function createInitialOfferStockQuantity(productId: Types.ObjectId): number {
  const tail = productId.toString().slice(-2);
  const parsed = Number.parseInt(tail, 16);

  return 100 + (Number.isNaN(parsed) ? 0 : parsed % 35);
}

//===============================================================

export async function addProductToMyPharmacyService(
  productId: string,
  userId: string
) {
  const [pharmacy, product] = await Promise.all([
    getCurrentUserPharmacyForProductManagement(userId),
    Product.findById(productId).lean(),
  ]);

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  if (product.status !== 'active') {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Blocked products cannot be added to a pharmacy.',
      undefined,

      PRODUCT_MANAGEMENT_ERROR_CODES.PRODUCT_BLOCKED
    );
  }

  const initialQuantity = createInitialOfferStockQuantity(product._id);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const existingOffer = await ProductOffer.exists({
        productId: product._id,
        pharmacyId: pharmacy._id,
      }).session(session);

      if (existingOffer) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This product is already added to your pharmacy.',
          undefined,

          PRODUCT_MANAGEMENT_ERROR_CODES.ALREADY_ADDED
        );
      }

      const [offer] = await ProductOffer.create(
        [
          {
            productId: product._id,
            pharmacyId: pharmacy._id,
            price: product.price ?? 0,
            totalQuantity: initialQuantity,
            availableQuantity: initialQuantity,
            reservedQuantity: 0,
          },
        ],
        { session }
      );

      await recordInitialStockArrival(
        {
          _id: offer._id as Types.ObjectId,
          productId: offer.productId as unknown as Types.ObjectId,
          pharmacyId: offer.pharmacyId as unknown as Types.ObjectId,
          price: offer.price,
          totalQuantity: offer.totalQuantity,
          availableQuantity: offer.availableQuantity,
          reservedQuantity: offer.reservedQuantity,
        },
        'Initial stock quantity added when the product was added to the pharmacy.',
        session
      );
    });
  } catch (error) {
    if (isDuplicateProductOfferError(error)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'This product is already added to your pharmacy.',
        undefined,

        PRODUCT_MANAGEMENT_ERROR_CODES.ALREADY_ADDED
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  const details = await getManagedProductDetailsService(productId, {
    userId,
    role: USER_ROLES.PHARMACY,
  });

  return {
    ...details,
    message: 'Product added to your pharmacy.',
  };
}

//===============================================================

export async function removeProductFromMyPharmacyService(
  productId: string,
  userId: string
) {
  const [pharmacy, product] = await Promise.all([
    getCurrentUserPharmacyForProductManagement(userId),
    Product.findById(productId).lean(),
  ]);

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const offer = await ProductOffer.findOne({
        productId: product._id,
        pharmacyId: pharmacy._id,
      }).session(session);

      if (!offer) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'This product is not added to your pharmacy.',
          undefined,

          PRODUCT_MANAGEMENT_ERROR_CODES.NOT_ADDED
        );
      }

      const hasRelatedOrders = await Order.exists({
        pharmacyId: pharmacy._id,
        'items.productOfferId': offer._id,
      }).session(session);

      if (hasRelatedOrders) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product cannot be removed because it already has related orders.',
          undefined,

          PRODUCT_MANAGEMENT_ERROR_CODES.HAS_RELATED_ORDERS
        );
      }

      await ProductOffer.deleteOne({ _id: offer._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  const details = await getManagedProductDetailsService(productId, {
    userId,
    role: USER_ROLES.PHARMACY,
  });

  return {
    ...details,
    message: 'Product was removed from your pharmacy.',
  };
}
