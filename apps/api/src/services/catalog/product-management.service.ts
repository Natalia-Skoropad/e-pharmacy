import mongoose, { Types } from 'mongoose';

import { USER_ROLES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { PRODUCT_MANAGEMENT_ERROR_CODES } from '../../constants/catalog/product-management';
import { API_MESSAGES } from '../../constants/shared/messages';

import { Product } from '../../models/catalog/product.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import {
  assertOwnerCatalogAccess,
  getOwnerSelectedProductIds,
  addOwnerCatalogProduct,
} from './owner-product-catalog.service';

import { ProductOffer } from '../../models/inventory/productOffer.model';
import { OwnerProductSelection } from '../../models/catalog/ownerProductSelection.model';
import { StockMovement } from '../../models/inventory/stockMovement.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { Order } from '../../models/orders/order.model';

import type { ManagedProductsQuery } from '../../schemas/catalog/product.schema';

import { recordInitialStockArrival } from '../inventory/stock-movement-write.service';

import { httpError } from '../../utils/http/httpError';
import { isDuplicateProductOfferError } from '../../utils/database/mongoError';

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
  actor: ProductManagementActor,
  ownerCatalog = false
) {
  if (actor.role !== USER_ROLES.PHARMACY) {
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');
  }

  if (ownerCatalog) {
    await assertOwnerCatalogAccess(actor.userId);

    const ids = await getOwnerSelectedProductIds(actor.userId);

    const [active, blocked] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'blocked' }),
    ]);

    const addedToPharmacy = await Product.countDocuments({
      _id: { $in: ids },
      status: { $in: ['active', 'blocked'] },
    });

    return {
      active,
      blocked,
      addedToPharmacy,
      notAddedToPharmacy: active + blocked - addedToPharmacy,
    };
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
  // Inventory across the authenticated owner's pharmacies, never public offers.
  if (query.ownerProducts) {
    if (actor.role !== USER_ROLES.PHARMACY || query.ownerCatalog)
      throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');

    await assertOwnerCatalogAccess(actor.userId);

    const pharmacyIds = (
      await Pharmacy.distinct('_id', { ownerId: actor.userId })
    ).map(String);

    if (query.pharmacyId && !pharmacyIds.includes(query.pharmacyId))
      throw httpError(
        HTTP_STATUS.FORBIDDEN,
        'You do not have access to this pharmacy.'
      );

    return getProductsByScope(query, 'management', undefined, {
      ...options,

      ownedPharmacyIds: pharmacyIds,

      offerVisibility: {
        mode: 'owner-management',
        pharmacyIds: query.pharmacyId ? [query.pharmacyId] : pharmacyIds,
      },
    });
  }

  if (query.ownerCatalog && actor.role === USER_ROLES.PHARMACY) {
    await assertOwnerCatalogAccess(actor.userId);

    const productIds = await getOwnerSelectedProductIds(actor.userId);

    const pharmacyIds = (
      await Pharmacy.distinct('_id', { ownerId: actor.userId })
    ).map(String);

    const result = await getProductsByScope(query, 'management', undefined, {
      ...options,
      ownerSelectedProductIds: productIds,
      offerVisibility: { mode: 'owner-management', pharmacyIds },
    });

    const selected = new Set(productIds.map(String));

    return {
      ...result,

      items: result.items.map((product) => ({
        ...product,
        isAddedToOwner: selected.has(product.id),
      })),
    };
  }

  const access = await resolveManagedProductsAccess(query, actor);

  return getProductsByScope(access.query, 'management', undefined, {
    ...options,
    offerVisibility: access.offerVisibility,
  });
}

//===============================================================

export async function getManagedProductDetailsService(
  productId: string,
  actor: ProductManagementActor,
  ownerCatalog = false
) {
  if (ownerCatalog && actor.role === USER_ROLES.PHARMACY) {
    await assertOwnerCatalogAccess(actor.userId);

    const [selectedIds, ownerPharmacyIds] = await Promise.all([
      getOwnerSelectedProductIds(actor.userId),
      Pharmacy.distinct('_id', { ownerId: actor.userId }),
    ]);

    const result = await getProductDetailsByScope(
      productId,
      undefined,
      'management',
      { mode: 'owner-management', pharmacyIds: ownerPharmacyIds.map(String) }
    );

    const isAddedToOwner = selectedIds.some((id) => String(id) === productId);

    return { ...result, product: { ...result.product, isAddedToOwner } };
  }

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
  userId: string,
  ownerCatalog = false
) {
  if (ownerCatalog) {
    const added = await addOwnerCatalogProduct(productId, userId);

    const pharmacyIds = (
      await Pharmacy.distinct('_id', { ownerId: userId })
    ).map(String);

    const details = await getProductDetailsByScope(
      productId,
      undefined,
      'management',
      { mode: 'owner-management', pharmacyIds }
    );

    return { ...details, message: added.message };
  }

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

/** Remove the product from the owner's catalog and every owned pharmacy.
 * Never remove a single pharmacy offer; keep historical orders and stock
 * movements intact by rejecting products that have operational history.
 */
async function removeOwnerProductSelectionService(
  productId: string,
  ownerId: string
) {
  await assertOwnerCatalogAccess(ownerId);

  const [product, pharmacyIds] = await Promise.all([
    Product.findById(productId).lean(),
    Pharmacy.distinct('_id', { ownerId: new Types.ObjectId(ownerId) }),
  ]);

  if (!product)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const offers = await ProductOffer.find({
        productId: product._id,
        pharmacyId: { $in: pharmacyIds },
      })
        .select('_id')
        .session(session)
        .lean<Array<{ _id: Types.ObjectId }>>();

      const offerIds = offers.map(({ _id }) => _id);

      // Orders remain authoritative even if an earlier stock snapshot is absent.
      const relatedOrders = await Order.exists({
        pharmacyId: { $in: pharmacyIds },
        'items.productId': product._id,
      }).session(session);

      if (relatedOrders) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product cannot be removed because it has related orders.',
          undefined,
          PRODUCT_MANAGEMENT_ERROR_CODES.HAS_RELATED_ORDERS
        );
      }

      // The automatic initial arrival is not a sale or an operator adjustment.
      // Any later movement is real history and must never be deleted.
      const activity = await StockMovement.exists({
        productOfferId: { $in: offerIds },
        $nor: [
          {
            eventType: 'arrival',
            source: 'pharmacy_stock',
            comment: /^Initial stock/i,
          },
        ],
      }).session(session);

      if (activity) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product cannot be removed because stock movement history exists.',
          undefined,
          PRODUCT_MANAGEMENT_ERROR_CODES.HAS_RELATED_ORDERS
        );
      }

      const comments = await PharmacyNote.exists({
        entityType: 'product',
        entityId: product._id,

        $or: [
          { ownerId: new Types.ObjectId(ownerId) },
          { pharmacyId: { $in: pharmacyIds } },
        ],
      }).session(session);

      if (comments) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product cannot be removed while internal comments need to be preserved.',
          undefined,
          PRODUCT_MANAGEMENT_ERROR_CODES.HAS_RELATED_ORDERS
        );
      }

      // Remove only synthetic initial arrivals for offers that can safely go.
      await StockMovement.deleteMany(
        { productOfferId: { $in: offerIds } },
        { session }
      );

      await ProductOffer.deleteMany({ _id: { $in: offerIds } }, { session });

      await OwnerProductSelection.deleteOne(
        {
          ownerId: new Types.ObjectId(ownerId),
          productId: product._id,
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  const details = await getManagedProductDetailsService(
    productId,
    { userId: ownerId, role: USER_ROLES.PHARMACY },
    true
  );

  return {
    ...details,
    message: 'Product removed from your owner catalog and pharmacies.',
  };
}

//===============================================================

export async function removeProductFromMyPharmacyService(
  productId: string,
  userId: string,
  ownerProducts = false
) {
  if (ownerProducts)
    return removeOwnerProductSelectionService(productId, userId);

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
