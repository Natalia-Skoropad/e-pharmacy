import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { Product } from '../../models/catalog/product.model';
import { ProductCategory } from '../../models/catalog/productCategory.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';

import {
  createCanonicalLocationRegExp,
  createFlexibleSearchRegExp,
} from '../../utils/validation/regexp';

import { logger } from '../../utils/logging/logger';

import { clonePharmacyLocation } from './pharmacy-location';
import { PUBLIC_PHARMACY_STATUS_FILTER } from './pharmacy-public-status';
import { PUBLIC_PHARMACY_IMAGE_PROJECTION } from './pharmacy-public-image';
import type { PharmacyDocument } from './pharmacy-profile.shared';

import type { PharmacySearchOptionsQuery } from '../../schemas/pharmacies/pharmacy-search-options.schema';

//===============================================================

// Every query applies search and relationship filters in MongoDB BEFORE
// pagination. Never materialize the entire catalog in a request or in the UI.
export async function getPharmacySearchOptionsService({
  kind,
  page,
  perPage,
  query,
  settlement,
  region,
  pharmacyId,
  selectedId,
  productId,
  category,
}: PharmacySearchOptionsQuery) {
  const skip = (page - 1) * perPage;
  const search = query?.trim();

  if (kind === 'pharmacy') {
    const filter: Record<string, unknown> = {
      status: PUBLIC_PHARMACY_STATUS_FILTER,
    };

    if (settlement) {
      filter['location.settlement'] = createCanonicalLocationRegExp(settlement);
    }

    if (region) {
      filter['location.region'] = createCanonicalLocationRegExp(region);
    }

    // A product/category relation is applied BEFORE page/count queries,
    // not to the first 50 options in the client. Only active products can
    // contribute a pharmacy to the public catalog.
    if (productId || category) {
      const categoryRecord = category
        ? await ProductCategory.findOne({ slug: category, status: 'active' })
            .select('_id')
            .lean<{ _id: Types.ObjectId } | null>()
        : null;

      const productIds: Types.ObjectId[] = [];

      if (productId) {
        const product = await Product.findOne({
          _id: productId,
          status: 'active',
        })
          .select('_id categoryId')
          .lean<{ _id: Types.ObjectId; categoryId: Types.ObjectId } | null>();

        if (
          product &&
          (!category ||
            String(product.categoryId) === String(categoryRecord?._id))
        ) {
          productIds.push(product._id);
        }
      } else if (categoryRecord) {
        const categoryProductIds = (await Product.distinct('_id', {
          status: 'active',
          categoryId: categoryRecord._id,
        })) as Types.ObjectId[];

        productIds.push(...categoryProductIds);
      }

      const relatedPharmacyIds = productIds.length
        ? await ProductOffer.distinct('pharmacyId', {
            productId: { $in: productIds },
            availableQuantity: { $gt: 0 },
          })
        : [];

      filter._id = { $in: relatedPharmacyIds };
    }

    if (selectedId) {
      // Selected-ID lookups still honor active status and any relationship.
      filter._id =
        productId || category
          ? {
              $eq: new Types.ObjectId(selectedId),
              $in: (filter._id as { $in: Types.ObjectId[] }).$in,
            }
          : new Types.ObjectId(selectedId);
    }

    if (search) {
      const pattern = createFlexibleSearchRegExp(search);

      filter.$or = [
        { name: pattern },
        { phone: pattern },
        { email: pattern },
        { 'location.address': pattern },
        { 'location.settlement': pattern },
        { 'location.region': pattern },
      ];
    }

    // A selected ID is a single-item lookup, not an alphabetic page.
    // Use the _id index explicitly so MongoDB cannot choose the broad status/
    // name sorting plan. This also avoids a second countDocuments query.
    if (selectedId) {
      const [selected] = await Pharmacy.aggregate<PharmacyDocument>([
        { $match: filter },
        { $limit: 1 },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            location: 1,
            imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION,
          },
        },
      ]).hint({ _id: 1 });

      const items = selected
        ? [
            {
              id: String(selected._id),
              name: selected.name,

              ...(selected.imageUrl ? { imageUrl: selected.imageUrl } : {}),
              ...(selected.email ? { email: selected.email } : {}),
              ...(selected.phone ? { phone: selected.phone } : {}),

              ...(selected.location
                ? { location: clonePharmacyLocation(selected.location) }
                : {}),
            },
          ]
        : [];

      return {
        kind,
        items,
        page,
        perPage,
        total: items.length,
        totalPages: items.length,
      };
    }

    const startedAt = Date.now();

    let idsReadMs = 0;
    let detailsReadMs = 0;
    let countReadMs = 0;

    // Paginate a lightweight, deterministically sorted ID set first. Large
    // imageUrl data URLs must not be part of MongoDB's sort/pagination result.
    // Hydrate only the IDs on the requested page, preserving their order.
    const [pageIds, total] = await Promise.all([
      Pharmacy.find(filter)
        .select('_id')
        .sort({ name: 1, _id: 1 })
        .skip(skip)
        .limit(perPage)
        .lean()

        .then((items) => {
          idsReadMs = Date.now() - startedAt;

          return items.map((item) => item._id);
        }),

      Pharmacy.countDocuments(filter).then((count) => {
        countReadMs = Date.now() - startedAt;

        return count;
      }),
    ]);

    const detailsStartedAt = Date.now();

    const fetched = pageIds.length
      ? await Pharmacy.aggregate<PharmacyDocument>([
          {
            $match: {
              _id: { $in: pageIds },
              status: PUBLIC_PHARMACY_STATUS_FILTER,
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
              location: 1,
              imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION,
            },
          },
        ])
      : [];

    detailsReadMs = Date.now() - detailsStartedAt;

    const detailsById = new Map(
      fetched.map((item) => [String(item._id), item])
    );

    const rows = pageIds.flatMap((id) => {
      const item = detailsById.get(String(id));

      return item ? [item] : [];
    });

    const rowsReadMs = Date.now() - startedAt;
    const durationMs = rowsReadMs;

    if (durationMs >= 1_500) {
      // Sizes and phase times only: never log the user's search, photos,
      // contact information, or any private pharmacy metadata.
      logger.info('[pharmacies] slow public pharmacy search options', {
        page,
        perPage,
        hasQuery: Boolean(search),
        hasLocationFilter: Boolean(settlement || region),
        hasSelectedId: false,
        rowsReadMs,
        idsReadMs,
        detailsReadMs,
        countReadMs,

        imageChars: rows.reduce(
          (sum, item) => sum + (item.imageUrl?.length ?? 0),
          0
        ),

        durationMs,
      });
    }

    return {
      kind,

      items: rows.map((pharmacy) => ({
        id: String(pharmacy._id),
        name: pharmacy.name,

        ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
        ...(pharmacy.email ? { email: pharmacy.email } : {}),
        ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),

        ...(pharmacy.location
          ? { location: clonePharmacyLocation(pharmacy.location) }
          : {}),
      })),

      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // Restrict locations by an explicitly selected pharmacy without loading
  // other pharmacies. Preserve the selected location if it conflicts with URL filters.
  const selectedPharmacy = pharmacyId
    ? await Pharmacy.findOne({
        _id: pharmacyId,
        status: PUBLIC_PHARMACY_STATUS_FILTER,
      })
        .select('location.settlement location.region')
        .lean()
    : null;

  const filter: Record<string, unknown> = {
    status: PHARMACY_STATUSES.ACTIVE,
    'location.settlement': { $type: 'string', $ne: '' },
  };

  if (settlement && !pharmacyId) {
    filter['location.settlement'] = createCanonicalLocationRegExp(settlement);
  }

  if (region && !pharmacyId) {
    filter['location.region'] = createCanonicalLocationRegExp(region);
  }

  // Product detail Location options must only include settlements of
  // pharmacies actually offering the selected active product. Apply the
  // relationship before the aggregate $facet so paging and counts match.
  if (productId) {
    const activeProduct = await Product.findOne({
      _id: productId,
      status: 'active',
    })
      .select('_id')
      .lean<{ _id: Types.ObjectId } | null>();

    const relatedIds = activeProduct
      ? await ProductOffer.distinct('pharmacyId', {
          productId: activeProduct._id,
          availableQuantity: { $gt: 0 },
        })
      : [];

    filter._id = { $in: relatedIds };
    filter.status = PUBLIC_PHARMACY_STATUS_FILTER;
  }

  if (pharmacyId) {
    if (!selectedPharmacy?.location?.settlement) {
      return { kind, items: [], page, perPage, total: 0, totalPages: 0 };
    }

    filter['location.settlement'] = createCanonicalLocationRegExp(
      selectedPharmacy.location.settlement
    );

    if (selectedPharmacy.location.region) {
      filter['location.region'] = createCanonicalLocationRegExp(
        selectedPharmacy.location.region
      );
    }
  }

  if (search) {
    const pattern = createFlexibleSearchRegExp(search);

    filter.$or = [
      { 'location.settlement': pattern },
      { 'location.region': pattern },
    ];
  }

  const [result] = await Pharmacy.aggregate<{
    results: Array<{ settlement: string; region: string }>;
    count: Array<{ total: number }>;
  }>([
    { $match: filter },
    {
      $project: {
        settlement: { $trim: { input: '$location.settlement' } },
        region: { $trim: { input: { $ifNull: ['$location.region', ''] } } },
      },
    },
    { $match: { settlement: { $ne: '' } } },
    { $group: { _id: { settlement: '$settlement', region: '$region' } } },
    {
      $project: {
        _id: 0,
        settlement: '$_id.settlement',
        region: '$_id.region',
      },
    },
    {
      $facet: {
        results: [
          { $sort: { settlement: 1, region: 1 } },
          { $skip: skip },
          { $limit: perPage },
        ],
        count: [{ $count: 'total' }],
      },
    },
  ]).collation({ locale: 'uk', strength: 2 });

  const total = result?.count[0]?.total ?? 0;

  return {
    kind,

    items: (result?.results ?? []).map((item) => ({
      settlement: item.settlement,

      ...(item.region ? { region: item.region } : {}),

      label: item.region
        ? `${item.settlement} (${item.region})`
        : item.settlement,
    })),

    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}
