import { Types, type ClientSession } from 'mongoose';

import { USER_ROLES, PHARMACY_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';

import { User } from '../../models/accounts/user.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { OwnerProductSelection } from '../../models/catalog/ownerProductSelection.model';

import { httpError } from '../../utils/http/httpError';
import { isDuplicateProductOfferError } from '../../utils/database/mongoError';

import { recordInitialStockArrival } from '../inventory/stock-movement-write.service';

//===================================================================

export const OWNER_CATALOG_ELIGIBLE_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===================================================================

// Install the new unique index even when a deployment disables automatic indexes.
let ownerSelectionIndexPromise: Promise<unknown> | null = null;

//===================================================================

async function ensureOwnerSelectionIndex(): Promise<void> {
  ownerSelectionIndexPromise ??= OwnerProductSelection.createIndexes().catch(
    (error: unknown) => {
      ownerSelectionIndexPromise = null;
      throw error;
    }
  );

  await ownerSelectionIndexPromise;
}

//===================================================================

/** The account owns the catalog; the selected pharmacy header never grants access. */
export async function assertOwnerCatalogAccess(userId: string): Promise<void> {
  if (!Types.ObjectId.isValid(userId))
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');

  const account = await User.findById(userId).select('role status').lean();

  if (
    !account ||
    account.role !== USER_ROLES.PHARMACY ||
    account.status === 'blocked'
  )
    throw httpError(HTTP_STATUS.FORBIDDEN, 'Access denied.');
  // Only the authenticated user's own pharmacies can receive owner catalog choices.
  // Manager memberships never expand the receiving owner scope.
}

//===================================================================

export async function getOwnerSelectedProductIds(
  ownerId: string
): Promise<Types.ObjectId[]> {
  const pharmacyIds = await Pharmacy.distinct('_id', { ownerId });

  const [selected, legacy] = await Promise.all([
    OwnerProductSelection.distinct('productId', { ownerId }),
    ProductOffer.distinct('productId', { pharmacyId: { $in: pharmacyIds } }),
  ]);

  return [
    ...new Map(
      [...selected, ...legacy].map((id) => [
        String(id),
        new Types.ObjectId(String(id)),
      ])
    ).values(),
  ];
}

//===================================================================

function initialQuantity(id: Types.ObjectId): number {
  const suffix = Number.parseInt(id.toHexString().slice(-2), 16);

  return 100 + (Number.isNaN(suffix) ? 0 : suffix % 35);
}

//===================================================================

/** Idempotent synchronization; never overwrites an existing pharmacy's price or stock. */
export async function ensureOwnerProductOffers(
  ownerId: string,
  pharmacyId: Types.ObjectId,
  session?: ClientSession
): Promise<void> {
  const selectedIds = await getOwnerSelectedProductIds(ownerId);

  if (!selectedIds.length) return;

  const products = await Product.find({
    _id: { $in: selectedIds },
    status: 'active',
  })
    .select('_id price')
    .session(session ?? null)
    .lean();

  for (const product of products) {
    const quantity = initialQuantity(product._id);

    let insertedOfferId: Types.ObjectId | undefined;

    try {
      const result = await ProductOffer.updateOne(
        { productId: product._id, pharmacyId },
        {
          $setOnInsert: {
            price: product.price ?? 0,
            totalQuantity: quantity,
            availableQuantity: quantity,
            reservedQuantity: 0,
          },
        },
        { upsert: true, session }
      );

      insertedOfferId = result.upsertedId ?? undefined;
    } catch (error) {
      // A concurrent activation/add may have inserted exactly this pair.
      if (isDuplicateProductOfferError(error)) continue;

      throw error;
    }

    if (!insertedOfferId) continue;

    const offer = await ProductOffer.findById(insertedOfferId)
      .session(session ?? null)
      .lean();

    if (!offer) throw new Error('Created product offer was not found.');

    await recordInitialStockArrival(
      {
        _id: offer._id,
        productId: offer.productId as unknown as Types.ObjectId,
        pharmacyId: offer.pharmacyId as unknown as Types.ObjectId,
        price: offer.price,
        totalQuantity: offer.totalQuantity,
        availableQuantity: offer.availableQuantity,
        reservedQuantity: offer.reservedQuantity,
      },
      'Initial stock added from the owner-wide product catalog.',
      session
    );
  }
}

//===================================================================

export async function addOwnerCatalogProduct(
  productId: string,
  ownerId: string
) {
  await assertOwnerCatalogAccess(ownerId);

  const product = await Product.findById(productId).lean();

  if (!product) throw httpError(HTTP_STATUS.NOT_FOUND, 'Product not found.');

  if (product.status !== 'active')
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Blocked products cannot be added.'
    );

  const activePharmacies = await Pharmacy.find({
    ownerId,
    status: { $in: OWNER_CATALOG_ELIGIBLE_STATUSES },
  })
    .select('_id')
    .lean();

  if (activePharmacies.length === 0) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'At least one Active or On moderation pharmacy is required to add a product.'
    );
  }

  await ensureOwnerSelectionIndex();

  await OwnerProductSelection.updateOne(
    { ownerId: new Types.ObjectId(ownerId), productId: product._id },
    {
      $setOnInsert: {
        ownerId: new Types.ObjectId(ownerId),
        productId: product._id,
      },
    },
    { upsert: true }
  );

  // Retaining the owner selection lets this operation be retried safely if one
  // pharmacy update fails, and permits all later activations to inherit it.
  for (const pharmacy of activePharmacies) {
    await ensureOwnerProductOffers(ownerId, pharmacy._id);
  }

  return { message: 'Product added to all active pharmacies.' };
}
