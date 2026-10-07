import type { ApiPaginationResponse } from '../api';
import type { PharmacyOwnerAccountStatus } from '../auth';
import type { PharmacyLocationDraft, PharmacyStatus } from '../pharmacies';
import type { EntityId, ISODateTimeString } from '../primitives';

//===================================================================

export type AdminPharmacyOwnerStatistics = Readonly<{
  all: number;
  new: number;
  active: number;
  blocked: number;
}>;

//===================================================================

export type AdminPharmacyOwnerListItem = Readonly<{
  id: EntityId;
  name: string;
  email: string;
  phone: string;
  pictureUrl?: string;
  status: PharmacyOwnerAccountStatus;
  registeredAt: ISODateTimeString;
  operatingPharmaciesCount: number;
  nonWorkingPharmaciesCount: number;
}>;

export type AdminPharmacyOwnerListResponse = Readonly<
  ApiPaginationResponse<AdminPharmacyOwnerListItem>
>;

//===================================================================

export type AdminPharmacyOwnerOption = Readonly<{
  id: EntityId;
  name: string;
  email: string;
  phone: string;
  pictureUrl?: string;
}>;

export type AdminPharmacyOwnerOptionsResponse = Readonly<{
  items: readonly AdminPharmacyOwnerOption[];
}>;

//===================================================================

export type AdminPharmacyOwnerDetail = Readonly<{
  id: EntityId;
  name: string;
  email: string;
  phone: string;
  address?: string;
  pictureUrl?: string;
  status: PharmacyOwnerAccountStatus;
  statusReason?: string;
  registeredAt: ISODateTimeString;
  lastPersonalDataUpdateAt: ISODateTimeString;

  pharmacyStatistics: Readonly<{
    all: number;
    new: number;
    onVerification: number;
    onModeration: number;
    active: number;
    blocked: number;
  }>;

  tabCounts: Readonly<{
    pharmacies: number;
    documents: number;
    comments: number;
  }>;
}>;

//===================================================================

export type AdminPharmacyOwnerPharmacySummary = Readonly<{
  id: EntityId;
  name: string;
  email?: string;
  phone?: string;
  location?: PharmacyLocationDraft;
  imageUrl?: string;
  createdAt: ISODateTimeString;
  status: PharmacyStatus;
  activeClientsCount: number;
  successfulOrdersCount: number;
  successfulRevenue: number;
  rating: number;
  reviewsCount: number;
}>;

export type AdminPharmacyOwnerPharmaciesResponse = Readonly<
  ApiPaginationResponse<AdminPharmacyOwnerPharmacySummary>
>;

//===================================================================

export type UpdateAdminPharmacyOwnerStatusPayload = Readonly<{
  status: Extract<PharmacyOwnerAccountStatus, 'active' | 'blocked'>;
  reason: string;
}>;

type AdminPharmacyOwnerStatusMutation = Readonly<{
  ownerId: EntityId;
  status: Extract<PharmacyOwnerAccountStatus, 'active' | 'blocked'>;
  blockedPharmacies: number;
}>;

export type AdminPharmacyOwnerStatusMutationResponse = Readonly<{
  owner: AdminPharmacyOwnerStatusMutation;
}>;
