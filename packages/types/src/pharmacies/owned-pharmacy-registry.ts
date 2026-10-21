import type { ApiPaginationResponse } from '../api';
import type { EntityId, ISODateTimeString } from '../primitives';
import type { PharmacyStatus } from './status';
import type { PharmacyLocationDraft } from './location';
import type { MyPharmacyProfile } from './pharmacy-profile';

//=============================================================================

// Metrics are intentionally omitted by the API for read_profile-only managers.
export type OwnedPharmacyListItem = Readonly<{
  id: EntityId;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  location?: PharmacyLocationDraft;
  status: PharmacyStatus;
  membershipRole: 'owner' | 'manager';
  createdAt: ISODateTimeString;
  addedProductsCount?: number;
  activeClientsCount?: number;
  successfulOrdersCount?: number;
  successfulRevenue?: number;
  rating: number;
  reviewsCount: number;
}>;

export type OwnedPharmacyListResponse = Readonly<
  ApiPaginationResponse<OwnedPharmacyListItem> & {
    earliestCreatedAt: string | null;
  }
>;

export type OwnedPharmacyStatistics = Readonly<{
  all: number;
  new: number;
  onVerification: number;
  active: number;
  onModeration: number;
  blocked: number;
}>;

export type OwnedPharmacyOption = Readonly<{
  id: EntityId;
  name: string;
  location?: PharmacyLocationDraft;
  status: PharmacyStatus;
  membershipRole: 'owner' | 'manager';
}>;

export type OwnedPharmacyOptionsResponse = Readonly<{
  items: readonly OwnedPharmacyOption[];
}>;

export type OwnedPharmacyDetailResponse = Readonly<{
  pharmacy: MyPharmacyProfile;

  metrics: Readonly<{
    activeClientsCount: number;
    addedProductsCount: number;
    successfulOrdersCount: number;
    successfulRevenue: number;
    rating: number;
    reviewsCount: number;
  }> | null;
}>;
