import 'client-only';

import {
  parseApiResponseData,
  parseOwnedPharmacyListResponse,
  parseOwnedPharmacyStatistics,
  parseOwnedPharmacyOptionsResponse,
  parseOwnedPharmacyDetailResponse,
} from '@e-pharmacy/api-client/response';

import { appendQueryParams } from '@e-pharmacy/api-client/transport';
import { localApiRequest } from '@e-pharmacy/next-api/browser';

import type {
  OwnedPharmacyListResponse,
  OwnedPharmacyStatistics,
  OwnedPharmacyOptionsResponse,
  OwnedPharmacyDetailResponse,
} from '@e-pharmacy/types/pharmacies';

import { pharmacyApiRoutes } from '@/lib/api/routes/pharmacy-api-routes';

import {
  sanitizeBrowserReadRequestOptions,
  type BrowserReadRequestOptions,
} from './request-options';

//===================================================================

export type OwnedPharmacyRegistryQuery = Readonly<{
  pharmacyId?: string;
  pharmacySearch?: string;
  settlement?: string;
  region?: string;
  status?: 'new' | 'on_verification' | 'active' | 'on_moderation' | 'blocked';
  createdFrom?: string;
  createdTo?: string;
  rating?: '0-0.9' | '1-1.9' | '2-2.9' | '3-3.9' | '4-5';
  sort?: 'created_desc' | 'created_asc';
  page?: number;
  perPage?: 20 | 50 | 100;
}>;

//===================================================================

export async function getOwnedPharmacies(
  params: OwnedPharmacyRegistryQuery = {},
  options?: BrowserReadRequestOptions
): Promise<OwnedPharmacyListResponse> {
  const path = appendQueryParams(
    pharmacyApiRoutes.pharmacies.ownedRegistry,
    params
  );
  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseOwnedPharmacyListResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOwnedPharmacyStatistics(
  options?: BrowserReadRequestOptions
): Promise<OwnedPharmacyStatistics> {
  const path = pharmacyApiRoutes.pharmacies.ownedRegistrySummary;

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseOwnedPharmacyStatistics,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOwnedPharmacyOptions(
  params: Readonly<{ search?: string; limit?: number }> = {},
  options?: BrowserReadRequestOptions
): Promise<OwnedPharmacyOptionsResponse> {
  const path = appendQueryParams(
    pharmacyApiRoutes.pharmacies.ownedRegistryOptions,
    params
  );

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseOwnedPharmacyOptionsResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

export async function getOwnedPharmacyDetail(
  pharmacyId: string,
  options?: BrowserReadRequestOptions
): Promise<OwnedPharmacyDetailResponse> {
  const path = pharmacyApiRoutes.pharmacies.ownedRegistryDetail(pharmacyId);

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    parseOwnedPharmacyDetailResponse,

    { url: path, method: 'GET' }
  );
}

//===================================================================

// The membership endpoint is the server's authoritative owner-vs-manager
// signal. An account with no memberships is eligible to create its first draft.
export async function getOwnedPharmacyMemberships(
  options?: BrowserReadRequestOptions
): Promise<
  readonly Readonly<{ id: string; membershipRole: 'owner' | 'manager' }>[]
> {
  const path = pharmacyApiRoutes.pharmacies.myMemberships;

  return parseApiResponseData(
    await localApiRequest(path, sanitizeBrowserReadRequestOptions(options)),

    (raw) => {
      if (
        !raw ||
        typeof raw !== 'object' ||
        !('pharmacies' in raw) ||
        !Array.isArray(raw.pharmacies)
      ) {
        throw new TypeError('Invalid pharmacy memberships.');
      }

      return raw.pharmacies.map((value: unknown) => {
        if (
          !value ||
          typeof value !== 'object' ||
          !('membershipRole' in value) ||
          !('id' in value) ||
          typeof value.id !== 'string' ||
          !/^[0-9a-f]{24}$/i.test(value.id) ||
          (value.membershipRole !== 'owner' &&
            value.membershipRole !== 'manager')
        ) {
          throw new TypeError('Invalid pharmacy membership.');
        }

        return { id: value.id, membershipRole: value.membershipRole };
      });
    },

    { url: path, method: 'GET' }
  );
}
