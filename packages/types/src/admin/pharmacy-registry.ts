import type { ApiPaginationResponse } from '../api';
import type { PharmacyLocationDraft, PharmacyStatus } from '../pharmacies';
import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type AdminPharmacyStatistics = Readonly<{
  all: number;
  new: number;
  onVerification: number;
  active: number;
  onModeration: number;
  blocked: number;
}>;

type AdminPharmacyOwnerLink = Readonly<{
  id: EntityId;
  name: string;
  pictureUrl?: string;
}>;

export type AdminPharmacyListItem = Readonly<{
  id: EntityId;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  location?: PharmacyLocationDraft;
  status: PharmacyStatus;
  createdAt: ISODateTimeString;
  owner: AdminPharmacyOwnerLink | null;
  activeClientsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
}>;

export type AdminPharmacyListResponse = Readonly<
  ApiPaginationResponse<AdminPharmacyListItem> & {
    earliestCreatedAt: string | null;
  }
>;

export type AdminPharmacyOption = Readonly<{
  id: EntityId;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  location?: PharmacyLocationDraft;
}>;

export type AdminPharmacyOptionsResponse = Readonly<{
  items: readonly AdminPharmacyOption[];
}>;

// Pharmacy-scoped owner suggestions never reveal owners' contact details.
type AdminPharmacyRegistryOwnerOption = Readonly<{
  id: EntityId;
  name: string;
  pictureUrl?: string;
}>;

export type AdminPharmacyRegistryOwnerOptionsResponse = Readonly<{
  items: readonly AdminPharmacyRegistryOwnerOption[];
}>;
