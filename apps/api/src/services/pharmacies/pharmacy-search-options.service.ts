import { Types } from 'mongoose';

import { PHARMACY_STATUSES } from '../../constants/auth/auth';
import { Pharmacy } from '../../models/pharmacies/pharmacy.model';

import {
  createCanonicalLocationRegExp,
  createFlexibleSearchRegExp,
} from '../../utils/validation/regexp';

import { clonePharmacyLocation } from './pharmacy-location';
import { PUBLIC_PHARMACY_STATUS_FILTER } from './pharmacy-public-status';

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

    if (selectedId) filter._id = new Types.ObjectId(selectedId);

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

    const [rows, total] = await Promise.all([
      Pharmacy.find(filter)
        .select('_id name imageUrl email phone location')
        .sort({ name: 1, _id: 1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Pharmacy.countDocuments(filter),
    ]);

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
