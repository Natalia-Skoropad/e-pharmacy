import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';

import { Client } from '../../models/clients/client.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { Order } from '../../models/orders/order.model';

import type {
  ProductCardSummaryResponseDto,
  ProductEntity,
  ProductOfferResponseDto,
  ProductResponseDto,
} from '../../types/catalog/product';

import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

import { requireISODateTime } from '../../utils/dates/date-contract';
import { buildPublicEntitySlugId } from '../../utils/catalog/public-slug-id';

//===============================================================

type ProductDocument = ProductEntity & { _id: Types.ObjectId };

//===============================================================

const PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES = [
  PHARMACY_STATUSES.ACTIVE,
  PHARMACY_STATUSES.ON_MODERATION,
] as const;

//===============================================================

export type ProductOfferVisibility =
  | Readonly<{ mode: 'public' }>
  | Readonly<{ mode: 'pharmacy-management'; pharmacyId: string }>
  | Readonly<{ mode: 'admin-management' }>;

//===============================================================

export async function getClientFavorites(userId?: string) {
  if (!userId)
    return { products: new Set<string>(), pharmacies: new Set<string>() };

  const client = await Client.findOne({ userId }).lean<{
    favoriteProductIds?: Types.ObjectId[];
    favoritePharmacyIds?: Types.ObjectId[];
  } | null>();

  return {
    products: new Set((client?.favoriteProductIds ?? []).map(String)),
    pharmacies: new Set((client?.favoritePharmacyIds ?? []).map(String)),
  };
}

//===============================================================

export async function getOffersByProductIds(
  productIds: Types.ObjectId[],
  favoritePharmacyIds = new Set<string>(),
  visibility: ProductOfferVisibility = { mode: 'public' }
) {
  const offers = await ProductOffer.find({
    productId: { $in: productIds },
  }).lean();

  const operationalOffers = offers.filter((offer) => {
    if (visibility.mode === 'admin-management') return true;

    return (
      visibility.mode === 'pharmacy-management' &&
      String(offer.pharmacyId) === visibility.pharmacyId
    );
  });

  const relatedOfferIds = new Set<string>(
    (operationalOffers.length
      ? await Order.distinct('items.productOfferId', {
          'items.productOfferId': {
            $in: operationalOffers.map((offer) => offer._id),
          },
        })
      : []
    ).map(String)
  );

  const pharmacyIds = [
    ...new Set(offers.map((offer) => String(offer.pharmacyId))),
  ];

  const pharmacyFilter: Record<string, unknown> = {
    _id: { $in: pharmacyIds },
  };

  if (visibility.mode === 'public') {
    pharmacyFilter.status = { $in: PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES };
  } else if (visibility.mode === 'pharmacy-management') {
    pharmacyFilter.$or = [
      { status: { $in: PUBLIC_PRODUCT_OFFER_PHARMACY_STATUSES } },
      { _id: new Types.ObjectId(visibility.pharmacyId) },
    ];
  }

  const pharmacies = await Pharmacy.find(pharmacyFilter).lean();

  const pharmacyMap = new Map(
    pharmacies.map((pharmacy) => [String(pharmacy._id), pharmacy])
  );

  const result = new Map<string, ProductOfferResponseDto[]>();

  for (const offer of offers) {
    const pharmacy = pharmacyMap.get(String(offer.pharmacyId));

    if (!pharmacy) continue;

    const canSeeOperationalFields =
      visibility.mode === 'admin-management' ||
      (visibility.mode === 'pharmacy-management' &&
        String(offer.pharmacyId) === visibility.pharmacyId);

    const item: ProductOfferResponseDto = {
      id: String(offer._id),
      pharmacyId: String(pharmacy._id),
      pharmacyName: pharmacy.name,

      ...(pharmacy.location
        ? {
            pharmacyLocation: {
              ...(pharmacy.location.address
                ? { address: pharmacy.location.address }
                : {}),

              ...(pharmacy.location.settlement
                ? { settlement: pharmacy.location.settlement }
                : {}),

              ...(pharmacy.location.region
                ? { region: pharmacy.location.region }
                : {}),

              ...(pharmacy.location.countryCode
                ? { countryCode: pharmacy.location.countryCode }
                : {}),
            },
          }
        : {}),

      ...(pharmacy.phone ? { pharmacyPhone: pharmacy.phone } : {}),
      ...(pharmacy.imageUrl ? { pharmacyImageUrl: pharmacy.imageUrl } : {}),

      pharmacyRating: pharmacy.rating ?? 0,
      pharmacyReviewsCount: pharmacy.reviewsCount ?? 0,
      pharmacyIsFavorite: favoritePharmacyIds.has(String(pharmacy._id)),
      price: offer.price,
      availableQuantity: offer.availableQuantity,
      inStock: offer.availableQuantity > 0,

      ...(canSeeOperationalFields
        ? {
            totalQuantity: offer.totalQuantity,
            reservedQuantity: offer.reservedQuantity,
            hasRelatedOrders: relatedOfferIds.has(String(offer._id)),
          }
        : {}),

      createdAt: requireISODateTime(offer.createdAt, 'productOffer.createdAt'),
      updatedAt: requireISODateTime(offer.updatedAt, 'productOffer.updatedAt'),
    };

    const key = String(offer.productId);

    result.set(key, [...(result.get(key) ?? []), item]);
  }

  return result;
}

//===============================================================

type ProductOfferSummary = Readonly<{
  minPrice: number;
  maxPrice: number;
  pharmaciesCount: number;
}>;

//===============================================================

export async function getOfferSummaryByProductIds(
  productIds: Types.ObjectId[],
  pharmacyId?: string
): Promise<Map<string, ProductOfferSummary>> {
  if (productIds.length === 0) return new Map();

  const match: Record<string, unknown> = {
    productId: { $in: productIds },
    availableQuantity: { $gt: 0 },
  };

  if (pharmacyId) match.pharmacyId = new Types.ObjectId(pharmacyId);

  const rows = await ProductOffer.aggregate<{
    _id: Types.ObjectId;
    minPrice: number;
    maxPrice: number;
    pharmaciesCount: number;
  }>([
    { $match: match },

    {
      $lookup: {
        from: Pharmacy.collection.name,
        localField: 'pharmacyId',
        foreignField: '_id',
        as: 'pharmacy',
      },
    },

    { $unwind: '$pharmacy' },

    {
      $match: {
        'pharmacy.status': { $in: ['active', 'on_moderation'] },
      },
    },

    {
      $group: {
        _id: { productId: '$productId', pharmacyId: '$pharmacyId' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },

    {
      $group: {
        _id: '$_id.productId',
        minPrice: { $min: '$minPrice' },
        maxPrice: { $max: '$maxPrice' },
        pharmaciesCount: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),

      {
        minPrice: row.minPrice,
        maxPrice: row.maxPrice,
        pharmaciesCount: row.pharmaciesCount,
      },
    ])
  );
}

//===============================================================

export function serializeProductCardSummary(
  product: ProductDocument,
  category: ProductCategoryReferenceDto,
  offerSummary: ProductOfferSummary | undefined,
  favoriteIds: Set<string>
): ProductCardSummaryResponseDto {
  const productId = String(product._id);
  const minPrice = offerSummary?.minPrice ?? null;
  const maxPrice = offerSummary?.maxPrice ?? null;
  const pharmaciesCount = offerSummary?.pharmaciesCount ?? 0;

  return {
    id: productId,
    name: product.name,

    publicSlugId: buildPublicEntitySlugId(
      'product',
      product.slug ?? product.name,
      productId
    ),

    article: product.article ?? '',
    category,
    status: product.status,
    price: minPrice ?? product.price ?? 0,
    minPrice,
    maxPrice,

    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),

    foundInPharmaciesCount: pharmaciesCount,
    availableInPharmaciesCount: pharmaciesCount,

    inStock: pharmaciesCount > 0,
    rating: product.rating ?? 0,

    reviewsCount: product.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(productId),

    createdAt: requireISODateTime(product.createdAt, 'product.createdAt'),
    updatedAt: requireISODateTime(product.updatedAt, 'product.updatedAt'),
  };
}

//===============================================================

export function serializeProductDetails(
  product: ProductDocument,
  category: ProductCategoryReferenceDto,
  offers: ProductOfferResponseDto[],
  favoriteIds: Set<string>
): ProductResponseDto {
  const availableOffers = offers.filter((offer) => offer.inStock);
  const first = availableOffers[0] ?? offers[0];

  const minPrice = availableOffers.length
    ? Math.min(...availableOffers.map((offer) => offer.price))
    : (product.price ?? 0);

  const productId = String(product._id);

  return {
    id: productId,
    name: product.name,

    publicSlugId: buildPublicEntitySlugId(
      'product',
      product.slug ?? product.name,
      productId
    ),

    ...(product.slug ? { slug: product.slug } : {}),

    article: product.article ?? '',

    ...(product.description ? { description: product.description } : {}),

    category,
    status: product.status,
    price: minPrice,

    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.dosage ? { dosage: product.dosage } : {}),

    ...(product.packageQuantity
      ? { packageQuantity: product.packageQuantity }
      : {}),

    ...(first
      ? { pharmacyId: first.pharmacyId, pharmacyName: first.pharmacyName }
      : {}),

    foundInPharmaciesCount: availableOffers.length,
    availableInPharmaciesCount: availableOffers.length,
    offers,

    inStock: availableOffers.length > 0,
    rating: product.rating ?? 0,

    reviewsCount: product.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(productId),

    createdAt: requireISODateTime(product.createdAt, 'product.createdAt'),
    updatedAt: requireISODateTime(product.updatedAt, 'product.updatedAt'),
  };
}
