import { Types } from 'mongoose';

import { USER_ROLES } from '../../../constants/auth';
import { HTTP_STATUS } from '../../../constants/httpStatus';

import { Pharmacy } from '../../../models/pharmacy.model';
import { User } from '../../../models/user.model';

import type { AdminPharmacyOwnerPharmaciesQuery } from '../../../schemas/admin-pharmacy-owner.schema';
import type { PharmacyLocationDraft } from '../../../types/pharmacy';

import { httpError } from '../../../utils/httpError';
import { buildPagedPharmacyItemsPipeline } from '../../pharmacies/registry/pharmacy-registry-query';
import { buildPharmacyMatch } from './admin-pharmacy-owner-filters';

//===============================================================

type OwnerPharmacyAggregateRow = Readonly<{
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: PharmacyLocationDraft | null;
  imageUrl: string | null;
  createdAt: Date;
  status: 'new' | 'on_verification' | 'on_moderation' | 'active' | 'blocked';
  activeClientsCount: number;
  addedProductsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
}>;

//===============================================================

type OwnerPharmaciesAggregateResult = Readonly<{
  items: OwnerPharmacyAggregateRow[];
  total: Array<{ count: number }>;
}>;

//===============================================================

export async function listAdminPharmacyOwnerPharmaciesService(
  ownerId: string,
  query: AdminPharmacyOwnerPharmaciesQuery
) {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const ownerExists = await User.exists({
    _id: ownerObjectId,
    role: USER_ROLES.PHARMACY,
  });

  if (!ownerExists) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Pharmacy owner was not found.');
  }

  const skip = (query.page - 1) * query.perPage;

  const [result] = await Pharmacy.aggregate<OwnerPharmaciesAggregateResult>([
    { $match: buildPharmacyMatch(ownerObjectId, query) },
    {
      $facet: {
        items: buildPagedPharmacyItemsPipeline(skip, query.perPage),
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result?.total[0]?.count ?? 0;

  const earliestOwner = await User.findOne({ role: USER_ROLES.PHARMACY })
    .sort({ createdAt: 1, _id: 1 })
    .select('createdAt')
    .lean<{ createdAt: Date } | null>();

  return {
    items: (result?.items ?? []).map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,

      ...(pharmacy.email ? { email: pharmacy.email } : {}),
      ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),

      ...(pharmacy.location ? { location: pharmacy.location } : {}),
      ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),

      createdAt: pharmacy.createdAt.toISOString(),
      status: pharmacy.status,
      activeClientsCount: pharmacy.activeClientsCount,
      addedProductsCount: pharmacy.addedProductsCount,
      successfulOrdersCount: pharmacy.successfulOrdersCount,
      successfulRevenue: pharmacy.successfulRevenue,
      rating: pharmacy.rating,
      reviewsCount: pharmacy.reviewsCount,
    })),

    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt:
      earliestOwner?.createdAt?.toISOString().slice(0, 10) ?? null,
  };
}
