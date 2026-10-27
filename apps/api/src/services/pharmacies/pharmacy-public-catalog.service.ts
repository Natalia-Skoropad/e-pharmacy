import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

import { Client } from '../../models/clients/client.model';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import type {
  PharmacyCardSummaryResponseDto,
  PublicPharmacyResponseDto,
  PharmacyFilterOptionsResponseDto,
  PharmacyLocationDraft,
} from '../../types/pharmacies/pharmacy';

import { httpError } from '../../utils/http/httpError';

import {
  createCanonicalLocationRegExp,
  createFlexibleSearchRegExp,
} from '../../utils/validation/regexp';

import { requireISODateTime } from '../../utils/dates/date-contract';
import { buildPublicEntitySlugId } from '../../utils/catalog/public-slug-id';

import { clonePharmacyLocation } from './pharmacy-location';
import { hasCompleteBankDetails } from './bank-details';

import type { PharmacyDocument } from './pharmacy-profile.shared';

import { PUBLIC_PHARMACY_STATUS_FILTER } from './pharmacy-public-status';

//===============================================================

type PharmaciesQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  pharmacyId?: string;
  settlement?: string;
  region?: string;
  sort?: 'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';

  //===============================================================
};
async function getFavoritePharmacyIds(userId?: string): Promise<Set<string>> {
  if (!userId) return new Set();

  const client = await Client.findOne({ userId })
    .select('favoritePharmacyIds')
    .lean<{ favoritePharmacyIds?: Types.ObjectId[] } | null>();

  return new Set((client?.favoritePharmacyIds ?? []).map(String));
}

//===============================================================

async function getAvailableProductsCountMap(pharmacyIds: Types.ObjectId[]) {
  const rows = await ProductOffer.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    {
      $match: {
        pharmacyId: { $in: pharmacyIds },
        availableQuantity: { $gt: 0 },
      },
    },

    {
      $lookup: {
        from: Product.collection.name,
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },

    { $unwind: '$product' },
    { $match: { 'product.status': 'active' } },
    { $group: { _id: '$pharmacyId', count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
}

//===============================================================

function serializePharmacyCardSummary(
  pharmacy: PharmacyDocument,
  availableProductsCount: number,
  favoriteIds: Set<string>
): PharmacyCardSummaryResponseDto {
  const pharmacyId = String(pharmacy._id);

  return {
    id: pharmacyId,
    name: pharmacy.name,

    publicSlugId: buildPublicEntitySlugId(
      'pharmacy',
      pharmacy.name,
      pharmacyId
    ),

    ...(pharmacy.location
      ? {
          location: {
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

    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),

    rating: pharmacy.rating ?? 0,

    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),

    availableProductsCount,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(pharmacyId),
  };
}

//===============================================================

function serializePublicPharmacy(
  pharmacy: PharmacyDocument,
  availableProductsCount: number,
  favoriteIds: Set<string>
): PublicPharmacyResponseDto {
  const pharmacyId = String(pharmacy._id);

  return {
    id: pharmacyId,
    name: pharmacy.name,

    publicSlugId: buildPublicEntitySlugId(
      'pharmacy',
      pharmacy.name,
      pharmacyId
    ),

    ...(pharmacy.location
      ? {
          location: {
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

    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.email ? { email: pharmacy.email } : {}),
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),

    bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),
    rating: pharmacy.rating ?? 0,

    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    ...(pharmacy.description ? { description: pharmacy.description } : {}),

    ...(pharmacy.shortDescription
      ? { shortDescription: pharmacy.shortDescription }
      : {}),

    availableProductsCount,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    isFavorite: favoriteIds.has(String(pharmacy._id)),
    updatedAt: requireISODateTime(pharmacy.updatedAt, 'pharmacy.updatedAt'),
  };
}

//===============================================================

export async function getPharmacyFiltersService(): Promise<PharmacyFilterOptionsResponseDto> {
  const pharmacies = await Pharmacy.find({
    status: PHARMACY_STATUSES.ACTIVE,
    'location.settlement': { $type: 'string', $ne: '' },
  })
    .select('location.settlement location.region')
    .lean<Array<{ location?: PharmacyLocationDraft }>>();

  const uniqueLocations = new Map<
    string,
    { settlement: string; region?: string }
  >();

  for (const pharmacy of pharmacies) {
    const settlement = pharmacy.location?.settlement?.trim();

    if (!settlement) continue;

    const region = pharmacy.location?.region?.trim() || undefined;

    const key = [settlement, region ?? '']
      .map((value) => value.normalize('NFKC').toLocaleLowerCase('uk-UA'))
      .join('\u0000');

    if (!uniqueLocations.has(key)) {
      uniqueLocations.set(key, {
        settlement,
        ...(region ? { region } : {}),
      });
    }
  }

  const locations = [...uniqueLocations.values()].sort((left, right) => {
    const settlementOrder = left.settlement.localeCompare(
      right.settlement,
      'uk-UA'
    );

    return settlementOrder !== 0
      ? settlementOrder
      : (left.region ?? '').localeCompare(right.region ?? '', 'uk-UA');
  });

  return {
    locations: locations.map((location) => ({
      ...location,

      label: location.region
        ? `${location.settlement} (${location.region})`
        : location.settlement,
    })),

    sort: [
      { value: 'newest', label: 'Newest first' },
      { value: 'rating-desc', label: 'Rating: highest first' },
      { value: 'rating-asc', label: 'Rating: lowest first' },
      { value: 'name-asc', label: 'Name: A to Z' },
      { value: 'name-desc', label: 'Name: Z to A' },
    ],
  };
}

//===============================================================

export async function getPharmacyOptionsService() {
  const pharmacies = await Pharmacy.find({
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  })
    .select('_id name imageUrl email phone location')
    .sort({ name: 1 })

    .lean<
      Array<
        Pick<
          PharmacyDocument,
          '_id' | 'name' | 'imageUrl' | 'email' | 'phone' | 'location'
        >
      >
    >();

  return {
    items: pharmacies.map((pharmacy) => ({
      id: String(pharmacy._id),
      name: pharmacy.name,

      ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
      ...(pharmacy.email ? { email: pharmacy.email } : {}),
      ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),

      ...(pharmacy.location
        ? { location: clonePharmacyLocation(pharmacy.location) }
        : {}),
    })),
  };
}

//===============================================================

export async function getFavoritePharmacyIdsService(userId: string) {
  const client = await Client.findOne({ userId })
    .select('favoritePharmacyIds')
    .lean<{ favoritePharmacyIds?: Types.ObjectId[] } | null>();

  return {
    ids: (client?.favoritePharmacyIds ?? []).map(String),
  };
}

//===============================================================

export async function getFavoritePharmaciesService(
  query: PharmaciesQuery,
  userId: string
) {
  const client = await Client.findOne({ userId })
    .select('favoritePharmacyIds')
    .lean<{ favoritePharmacyIds?: Types.ObjectId[] } | null>();

  const favoriteIdsArray = client?.favoritePharmacyIds ?? [];
  const favoriteIds = new Set(favoriteIdsArray.map(String));

  const filter = {
    _id: { $in: favoriteIdsArray },
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  };

  const sort: Record<string, 1 | -1> =
    query.sort === 'name-desc' ? { name: -1 } : { name: 1 };

  const skip = (query.page - 1) * query.perPage;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find(filter).sort(sort).skip(skip).limit(query.perPage).lean(),
    Pharmacy.countDocuments(filter),
  ]);

  const countMap = await getAvailableProductsCountMap(
    pharmacies.map((pharmacy) => pharmacy._id)
  );

  return {
    items: pharmacies.map((pharmacy) =>
      serializePharmacyCardSummary(
        pharmacy,
        countMap.get(String(pharmacy._id)) ?? 0,
        favoriteIds
      )
    ),

    page: total === 0 ? 1 : query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
  };
}

//===============================================================

export async function getPharmaciesService(
  query: PharmaciesQuery,
  userId?: string
) {
  const filter: Record<string, unknown> = {
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  };

  if (query.pharmacyId) {
    filter._id = query.pharmacyId;
  }

  if (query.keyword) {
    filter.$or = [
      { name: createFlexibleSearchRegExp(query.keyword) },
      { 'location.address': createFlexibleSearchRegExp(query.keyword) },
      { 'location.settlement': createFlexibleSearchRegExp(query.keyword) },
      { 'location.region': createFlexibleSearchRegExp(query.keyword) },
    ];
  }

  if (query.nameKeyword) {
    filter.name = createFlexibleSearchRegExp(query.nameKeyword);
  }

  if (query.addressKeyword) {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? filter.$and : []),

      {
        $or: [
          {
            'location.address': createFlexibleSearchRegExp(
              query.addressKeyword
            ),
          },
          {
            'location.settlement': createFlexibleSearchRegExp(
              query.addressKeyword
            ),
          },
          {
            'location.region': createFlexibleSearchRegExp(query.addressKeyword),
          },
        ],
      },
    ];
  }

  // Match every pharmacy belonging to the same deduplicated location,
  // including owner-entered case/outer-space variants (e.g. Dnipro/dnipro).
  if (query.settlement) {
    filter['location.settlement'] = createCanonicalLocationRegExp(
      query.settlement
    );
  }

  if (query.region) {
    filter['location.region'] = createCanonicalLocationRegExp(query.region);
  }

  const sort: Record<string, 1 | -1> =
    query.sort === 'name-asc'
      ? { name: 1 }
      : query.sort === 'name-desc'
        ? { name: -1 }
        : query.sort === 'rating-asc'
          ? { rating: 1 }
          : query.sort === 'rating-desc'
            ? { rating: -1 }
            : { createdAt: -1 };

  const skip = (query.page - 1) * query.perPage;

  const [pharmacies, total, favoriteIds] = await Promise.all([
    Pharmacy.find(filter).sort(sort).skip(skip).limit(query.perPage).lean(),
    Pharmacy.countDocuments(filter),
    getFavoritePharmacyIds(userId),
  ]);

  const countMap = await getAvailableProductsCountMap(
    pharmacies.map((pharmacy) => pharmacy._id)
  );

  return {
    items: pharmacies.map((pharmacy) =>
      serializePharmacyCardSummary(
        pharmacy,
        countMap.get(String(pharmacy._id)) ?? 0,
        favoriteIds
      )
    ),

    page: total === 0 ? 1 : query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),
  };
}

//===============================================================

export async function getPharmacyDetailsService(
  pharmacyId: string,
  userId?: string
) {
  const pharmacy = await Pharmacy.findOne({
    _id: pharmacyId,
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  }).lean();

  if (!pharmacy)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);

  const [favoriteIds, countMap] = await Promise.all([
    getFavoritePharmacyIds(userId),
    getAvailableProductsCountMap([pharmacy._id]),
  ]);

  return {
    pharmacy: serializePublicPharmacy(
      pharmacy,
      countMap.get(String(pharmacy._id)) ?? 0,
      favoriteIds
    ),
  };
}

//===============================================================

export async function getPharmacyCheckoutDetailsService(pharmacyId: string) {
  const pharmacy = await Pharmacy.findOne({
    _id: pharmacyId,
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  })
    .select('name location phone email workingHours bankDetails')
    .lean<Pick<
      PharmacyDocument,
      | '_id'
      | 'name'
      | 'location'
      | 'phone'
      | 'email'
      | 'workingHours'
      | 'bankDetails'
    > | null>();

  if (!pharmacy) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  return {
    pharmacy: {
      id: String(pharmacy._id),
      name: pharmacy.name,

      ...(pharmacy.location
        ? { location: clonePharmacyLocation(pharmacy.location) }
        : {}),

      ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
      ...(pharmacy.email ? { email: pharmacy.email } : {}),
      ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),

      bankTransferAvailable: hasCompleteBankDetails(pharmacy.bankDetails),

      ...(hasCompleteBankDetails(pharmacy.bankDetails)
        ? { bankDetails: pharmacy.bankDetails }
        : {}),
    },
  };
}

//===============================================================

export async function setFavoritePharmacyService(
  pharmacyId: string,
  userId: string,
  isFavorite: boolean
) {
  const exists = await Pharmacy.exists({
    _id: pharmacyId,
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  });

  if (!exists)
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);

  const result = await Client.updateOne(
    { userId },

    isFavorite
      ? { $addToSet: { favoritePharmacyIds: pharmacyId } }
      : { $pull: { favoritePharmacyIds: pharmacyId } }
  );

  if (result.matchedCount === 0) {
    throw httpError(HTTP_STATUS.FORBIDDEN, API_MESSAGES.FORBIDDEN_ROLE);
  }

  return {
    isFavorite,

    message: isFavorite
      ? 'Pharmacy was added to favorites.'
      : 'Pharmacy was removed from favorites.',
  };
}
