import { normalizePaginatedResponse } from '@e-pharmacy/utils/api';

import {
  getNumberValue,
  getStringValue,
  isRecord,
} from '@e-pharmacy/utils/guards';

import type { EntityId, UserStatus } from '@e-pharmacy/types';

//===================================================================

export const CLIENT_STATUSES = [
  'active',
  'blocked',
] as const satisfies readonly UserStatus[];

//===================================================================

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

//===================================================================

export type PharmacyClientRow = Readonly<{
  id: EntityId;
  photoUrl: string | null;
  firstOrderAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
  status: ClientStatus;
}>;

export type PharmacyClientsQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  firstOrderFrom?: string;
  firstOrderTo?: string;
  name?: string;
  clientId?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
}>;

export type PharmacyClientsResponse = Readonly<{
  items: PharmacyClientRow[];
  total: number;
}>;

//===================================================================

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
};

//===================================================================

function isClientStatus(value: unknown): value is ClientStatus {
  return CLIENT_STATUSES.includes(value as ClientStatus);
}

//===================================================================

function getNestedRecord(
  source: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = source[key];

  return isRecord(value) ? value : undefined;
}

//===================================================================

function getClientId(client: Record<string, unknown>): string | undefined {
  return (
    getStringValue(client.id) ??
    getStringValue(client.clientId) ??
    getStringValue(client._id)
  );
}

//===================================================================

function getClientName(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.name) ??
    getStringValue(client.fullName) ??
    (nestedClient ? getStringValue(nestedClient.name) : undefined) ??
    (nestedClient ? getStringValue(nestedClient.fullName) : undefined) ??
    (profile ? getStringValue(profile.name) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientEmail(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.email) ??
    (nestedClient ? getStringValue(nestedClient.email) : undefined) ??
    (profile ? getStringValue(profile.email) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientPhone(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.phone) ??
    (nestedClient ? getStringValue(nestedClient.phone) : undefined) ??
    (profile ? getStringValue(profile.phone) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientAddress(client: Record<string, unknown>): string {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.address) ??
    (nestedClient ? getStringValue(nestedClient.address) : undefined) ??
    (profile ? getStringValue(profile.address) : undefined) ??
    'Not specified'
  );
}

//===================================================================

function getClientPhoto(client: Record<string, unknown>): string | null {
  const nestedClient = getNestedRecord(client, 'client');
  const profile = getNestedRecord(client, 'profile');

  return (
    getStringValue(client.photoUrl) ??
    getStringValue(client.pictureUrl) ??
    getStringValue(client.avatarUrl) ??
    (nestedClient ? getStringValue(nestedClient.photoUrl) : undefined) ??
    (nestedClient ? getStringValue(nestedClient.pictureUrl) : undefined) ??
    (profile ? getStringValue(profile.photoUrl) : undefined) ??
    (profile ? getStringValue(profile.pictureUrl) : undefined) ??
    null
  );
}

//===================================================================

function getSuccessfulOrdersCount(client: Record<string, unknown>): number {
  const statistics = getNestedRecord(client, 'statistics');
  const successful = statistics
    ? getNestedRecord(statistics, 'successful')
    : undefined;

  return (
    getNumberValue(client.successfulOrdersCount) ??
    getNumberValue(client.successfulOrders) ??
    (statistics
      ? getNumberValue(statistics.successfulOrdersCount)
      : undefined) ??
    (successful ? getNumberValue(successful.count) : undefined) ??
    0
  );
}

//===================================================================

function getSuccessfulOrdersAmount(client: Record<string, unknown>): number {
  const statistics = getNestedRecord(client, 'statistics');
  const successful = statistics
    ? getNestedRecord(statistics, 'successful')
    : undefined;

  return (
    getNumberValue(client.successfulOrdersAmount) ??
    getNumberValue(client.successfulOrdersTotal) ??
    (statistics
      ? getNumberValue(statistics.successfulOrdersAmount)
      : undefined) ??
    (successful ? getNumberValue(successful.amount) : undefined) ??
    0
  );
}

//===================================================================

export function normalizePharmacyClient(
  rawClient: unknown
): PharmacyClientRow | null {
  if (!isRecord(rawClient)) return null;

  const id = getClientId(rawClient);
  if (!id) return null;

  return {
    id,
    photoUrl: getClientPhoto(rawClient),
    firstOrderAt:
      getStringValue(rawClient.firstOrderAt) ??
      getStringValue(rawClient.firstOrderDate) ??
      getStringValue(rawClient.createdAt) ??
      '',
    name: getClientName(rawClient),
    email: getClientEmail(rawClient),
    phone: getClientPhone(rawClient),
    address: getClientAddress(rawClient),
    successfulOrdersCount: getSuccessfulOrdersCount(rawClient),
    successfulOrdersAmount: getSuccessfulOrdersAmount(rawClient),
    status: isClientStatus(rawClient.status) ? rawClient.status : 'active',
  };
}

//===================================================================

export function normalizePharmacyClientsResponse(
  payload: unknown
): PharmacyClientsResponse {
  return normalizePaginatedResponse(payload, {
    itemKeys: ['items', 'clients'],
    normalizeItem: normalizePharmacyClient,
  });
}
