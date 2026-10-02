import type { Connection, Types } from 'mongoose';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

//===============================================================

type Database = NonNullable<Connection['db']>;
type IndexKey = Readonly<Record<string, 1 | -1>>;

type IndexInfo = Readonly<{
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
}>;

type LegacyPharmacy = Readonly<{
  _id: unknown;
  ownerId: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  status?: unknown;
  createdAt?: unknown;
}>;

type OwnerUser = Readonly<{
  _id: Types.ObjectId;
  role?: unknown;
  status?: unknown;
  email?: unknown;
  phone?: unknown;
}>;

type DemoOwnerCandidate = Readonly<{
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: typeof USER_ROLES.PHARMACY;
  status: typeof USER_STATUSES.NEW | typeof USER_STATUSES.ACTIVE;
  phone: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export type PharmacyOwnerFoundationMigrationOptions = Readonly<{
  demoOwnerPasswordHash: string;
}>;

//===============================================================

const OWNER_INDEXES = [
  { name: 'ownerId_1', key: { ownerId: 1 } },
  { name: 'ownerId_1_status_1', key: { ownerId: 1, status: 1 } },
  {
    name: 'ownerId_1_createdAt_-1',
    key: { ownerId: 1, createdAt: -1 },
  },
] as const satisfies readonly Readonly<{
  name: string;
  key: IndexKey;
}>[];

//===============================================================

const LEGACY_DEMO_PHARMACY_EMAIL_PATTERN =
  /^pharmacy\.(\d+)@e-pharmacy\.example\.com$/i;

const UKRAINE_PHONE_PATTERN = /^\+380\d{9}$/;
const DEMO_OWNER_NAME_FALLBACK = 'Demo Pharmacy Owner';
const USER_NAME_MAX_LENGTH = 50;

//===============================================================

export type PharmacyOwnerFoundationMigrationResult = Readonly<{
  droppedUniqueOwnerIndexes: number;
  ownerIndexes: readonly string[];
  ownerAccounts: number;
  activeOwners: number;
  newOwners: number;
  blockedOwners: number;
  modifiedOwnerAccounts: number;
  createdDemoOwnerAccounts: number;
  unresolvedOwnerIds: number;
  unresolvedOwnerIdSamples: readonly string[];
}>;

//===============================================================

function hasExactIndexKey(
  actual: Record<string, unknown>,
  expected: IndexKey
): boolean {
  const actualEntries = Object.entries(actual);
  const expectedEntries = Object.entries(expected);

  return (
    actualEntries.length === expectedEntries.length &&
    actualEntries.every(
      ([key, value], index) =>
        key === expectedEntries[index]?.[0] &&
        value === expectedEntries[index]?.[1]
    )
  );
}

//===============================================================

function isNamespaceNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: unknown; codeName?: unknown };
  return candidate.code === 26 || candidate.codeName === 'NamespaceNotFound';
}

//===============================================================

async function readIndexes(
  collection: ReturnType<Database['collection']>
): Promise<IndexInfo[]> {
  try {
    return (await collection.indexes()) as IndexInfo[];
  } catch (error) {
    if (isNamespaceNotFoundError(error)) return [];
    throw error;
  }
}

//===============================================================

async function ensureNonUniqueIndex(
  collection: ReturnType<Database['collection']>,
  definition: (typeof OWNER_INDEXES)[number]
): Promise<{ name: string; droppedUnique: boolean }> {
  const indexes = await readIndexes(collection);
  const existing = indexes.find((index) =>
    hasExactIndexKey(index.key, definition.key)
  );

  if (existing?.unique) {
    if (!existing.name) {
      throw new Error(
        `Cannot migrate unique pharmacy index ${JSON.stringify(definition.key)} because it has no name.`
      );
    }

    await collection.dropIndex(existing.name);
    const name = await collection.createIndex(definition.key, {
      name: definition.name,
    });

    return { name, droppedUnique: true };
  }

  if (existing?.name) {
    return { name: existing.name, droppedUnique: false };
  }

  const name = await collection.createIndex(definition.key, {
    name: definition.name,
  });

  return { name, droppedUnique: false };
}

//===============================================================

function objectIdSet(values: readonly unknown[]): Set<string> {
  return new Set(values.map((value) => String(value)));
}

//===============================================================

function getLegacyDemoPharmacyNumber(pharmacy: LegacyPharmacy): number | null {
  if (typeof pharmacy.email !== 'string') return null;

  const match = pharmacy.email.trim().match(LEGACY_DEMO_PHARMACY_EMAIL_PATTERN);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

//===============================================================

function isLegacyDemoPharmacy(pharmacy: LegacyPharmacy): boolean {
  return getLegacyDemoPharmacyNumber(pharmacy) !== null;
}

//===============================================================

function getDemoOwnerPhone(pharmacy: LegacyPharmacy): string {
  if (
    typeof pharmacy.phone === 'string' &&
    UKRAINE_PHONE_PATTERN.test(pharmacy.phone.trim())
  ) {
    return pharmacy.phone.trim();
  }

  const pharmacyNumber = getLegacyDemoPharmacyNumber(pharmacy);
  if (pharmacyNumber === null) {
    throw new Error(
      'Cannot derive a demo owner phone for a non-demo pharmacy.'
    );
  }

  return `+380${String(501000000 + pharmacyNumber).padStart(9, '0')}`;
}

//===============================================================

function createDemoOwnerName(pharmacyName: unknown): string {
  if (typeof pharmacyName !== 'string') return DEMO_OWNER_NAME_FALLBACK;

  const words = pharmacyName.match(/[A-Za-z]+(?:-[A-Za-z]+)?/g) ?? [];
  const meaningfulWords = words.slice(0, 3);
  if (!meaningfulWords.length) return DEMO_OWNER_NAME_FALLBACK;

  const candidate = `${meaningfulWords.join(' ')} Owner`;
  return candidate.length <= USER_NAME_MAX_LENGTH
    ? candidate
    : DEMO_OWNER_NAME_FALLBACK;
}

//===============================================================

function toCreatedAt(value: unknown): Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value
    : new Date();
}

//===============================================================

function assertUniqueCandidateCredentials(
  candidates: readonly DemoOwnerCandidate[]
): void {
  const emails = new Set<string>();
  const phones = new Set<string>();

  for (const candidate of candidates) {
    if (emails.has(candidate.email)) {
      throw new Error(
        `Cannot create demo pharmacy owners because email ${candidate.email} is shared by multiple unresolved owner ids.`
      );
    }

    if (phones.has(candidate.phone)) {
      throw new Error(
        `Cannot create demo pharmacy owners because phone ${candidate.phone} is shared by multiple unresolved owner ids.`
      );
    }

    emails.add(candidate.email);
    phones.add(candidate.phone);
  }
}

//===============================================================

async function createMissingDemoOwnerUsers(
  db: Database,
  unresolvedOwnerIds: readonly unknown[],
  demoOwnerPasswordHash: string
): Promise<number> {
  if (!unresolvedOwnerIds.length) return 0;

  const pharmacies = db.collection('pharmacies');
  const users = db.collection('users');

  const unresolvedPharmacies = (await pharmacies
    .find(
      { ownerId: { $in: unresolvedOwnerIds } },
      {
        projection: {
          _id: 1,
          ownerId: 1,
          name: 1,
          email: 1,
          phone: 1,
          address: 1,
          status: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: 1, _id: 1 })
    .toArray()) as LegacyPharmacy[];

  const byOwnerId = new Map<string, LegacyPharmacy[]>();

  for (const pharmacy of unresolvedPharmacies) {
    const ownerId = String(pharmacy.ownerId);
    const current = byOwnerId.get(ownerId) ?? [];
    current.push(pharmacy);
    byOwnerId.set(ownerId, current);
  }

  const candidates: DemoOwnerCandidate[] = [];

  for (const ownerId of unresolvedOwnerIds) {
    const linkedPharmacies = byOwnerId.get(String(ownerId)) ?? [];

    // Only the controlled 98 demo pharmacies from the original client seed are
    // repaired automatically. Unknown real/legacy orphan references remain
    // unresolved instead of being assigned an invented account.
    if (
      !linkedPharmacies.length ||
      !linkedPharmacies.every(isLegacyDemoPharmacy)
    ) {
      continue;
    }

    const primary = linkedPharmacies[0];
    const createdAt = toCreatedAt(primary.createdAt);
    const hasActivePharmacy = linkedPharmacies.some(
      (pharmacy) => pharmacy.status === PHARMACY_STATUSES.ACTIVE
    );

    candidates.push({
      _id: ownerId as Types.ObjectId,
      name: createDemoOwnerName(primary.name),
      email: String(primary.email).trim().toLowerCase(),
      password: demoOwnerPasswordHash,
      role: USER_ROLES.PHARMACY,
      status: hasActivePharmacy ? USER_STATUSES.ACTIVE : USER_STATUSES.NEW,
      phone: getDemoOwnerPhone(primary),
      ...(typeof primary.address === 'string' && primary.address.trim()
        ? { address: primary.address.trim() }
        : {}),
      createdAt,
      updatedAt: createdAt,
    });
  }

  if (!candidates.length) return 0;

  assertUniqueCandidateCredentials(candidates);

  const existingCredentialUsers = (await users
    .find(
      {
        $or: [
          { email: { $in: candidates.map((candidate) => candidate.email) } },
          { phone: { $in: candidates.map((candidate) => candidate.phone) } },
        ],
      },
      { projection: { _id: 1, email: 1, phone: 1, role: 1 } }
    )
    .toArray()) as OwnerUser[];

  if (existingCredentialUsers.length > 0) {
    throw new Error(
      `Cannot create demo pharmacy owners because ${existingCredentialUsers.length} candidate email/phone value(s) are already used by other User records. Conflicting user ids: ${existingCredentialUsers.map((user) => String(user._id)).join(', ')}.`
    );
  }

  const insertResult = await users.insertMany(candidates, { ordered: true });
  return insertResult.insertedCount;
}

//===============================================================

export async function migratePharmacyOwnerFoundation(
  db: Database,
  options: PharmacyOwnerFoundationMigrationOptions
): Promise<PharmacyOwnerFoundationMigrationResult> {
  const pharmacies = db.collection('pharmacies');
  const users = db.collection('users');

  const ownerIds = await pharmacies.distinct('ownerId', {
    ownerId: { $exists: true, $ne: null },
  });

  let ownerUsers =
    ownerIds.length > 0
      ? ((await users
          .find(
            { _id: { $in: ownerIds } },
            { projection: { _id: 1, role: 1, status: 1 } }
          )
          .toArray()) as OwnerUser[])
      : [];

  const initialFoundOwnerIdSet = objectIdSet(
    ownerUsers.map((owner) => owner._id)
  );
  const initialUnresolvedOwnerIds = ownerIds.filter(
    (ownerId) => !initialFoundOwnerIdSet.has(String(ownerId))
  );

  const invalidRoleOwners = ownerUsers.filter(
    (owner) => owner.role !== USER_ROLES.PHARMACY
  );

  if (invalidRoleOwners.length > 0) {
    throw new Error(
      `Cannot migrate pharmacy owners because Pharmacy.ownerId must reference role="pharmacy" users. Invalid owner ids: ${invalidRoleOwners.map((owner) => String(owner._id)).join(', ')}.`
    );
  }

  const createdDemoOwnerAccounts = await createMissingDemoOwnerUsers(
    db,
    initialUnresolvedOwnerIds,
    options.demoOwnerPasswordHash
  );

  if (createdDemoOwnerAccounts > 0) {
    ownerUsers = (await users
      .find(
        { _id: { $in: ownerIds } },
        { projection: { _id: 1, role: 1, status: 1 } }
      )
      .toArray()) as OwnerUser[];
  }

  const foundOwnerIdSet = objectIdSet(ownerUsers.map((owner) => owner._id));
  const unresolvedOwnerIds = ownerIds.filter(
    (ownerId) => !foundOwnerIdSet.has(String(ownerId))
  );

  const invalidRoleOwnersAfterRepair = ownerUsers.filter(
    (owner) => owner.role !== USER_ROLES.PHARMACY
  );

  if (invalidRoleOwnersAfterRepair.length > 0) {
    throw new Error(
      `Cannot migrate pharmacy owners because Pharmacy.ownerId must reference role="pharmacy" users. Invalid owner ids: ${invalidRoleOwnersAfterRepair.map((owner) => String(owner._id)).join(', ')}.`
    );
  }

  const ownerIndexNames: string[] = [];
  let droppedUniqueOwnerIndexes = 0;

  for (const definition of OWNER_INDEXES) {
    const result = await ensureNonUniqueIndex(pharmacies, definition);
    ownerIndexNames.push(result.name);
    if (result.droppedUnique) droppedUniqueOwnerIndexes += 1;
  }

  const validOwnerIds = ownerUsers.map((owner) => owner._id);

  if (validOwnerIds.length === 0) {
    return {
      droppedUniqueOwnerIndexes,
      ownerIndexes: ownerIndexNames,
      ownerAccounts: 0,
      activeOwners: 0,
      newOwners: 0,
      blockedOwners: 0,
      modifiedOwnerAccounts: 0,
      createdDemoOwnerAccounts,
      unresolvedOwnerIds: unresolvedOwnerIds.length,
      unresolvedOwnerIdSamples: unresolvedOwnerIds.slice(0, 10).map(String),
    };
  }

  const activeOwnerIds = await pharmacies.distinct('ownerId', {
    status: PHARMACY_STATUSES.ACTIVE,
  });

  const activeOwnerIdSet = objectIdSet(activeOwnerIds);
  const newOwnerIds = validOwnerIds.filter(
    (ownerId) => !activeOwnerIdSet.has(String(ownerId))
  );

  const blockedOwners = ownerUsers.filter(
    (owner) => owner.status === USER_STATUSES.BLOCKED
  );

  const blockedOwnerIdSet = objectIdSet(
    blockedOwners.map((owner) => owner._id)
  );

  const activeOwners = validOwnerIds.filter(
    (ownerId) =>
      activeOwnerIdSet.has(String(ownerId)) &&
      !blockedOwnerIdSet.has(String(ownerId))
  );

  const newOwners = newOwnerIds.filter(
    (ownerId) => !blockedOwnerIdSet.has(String(ownerId))
  );

  const [activeUpdate, newUpdate] = await Promise.all([
    activeOwners.length > 0
      ? users.updateMany(
          {
            _id: { $in: activeOwners },
            role: USER_ROLES.PHARMACY,
            status: { $ne: USER_STATUSES.BLOCKED },
          },
          { $set: { status: USER_STATUSES.ACTIVE } }
        )
      : Promise.resolve({ modifiedCount: 0 }),
    newOwners.length > 0
      ? users.updateMany(
          {
            _id: { $in: newOwners },
            role: USER_ROLES.PHARMACY,
            status: { $ne: USER_STATUSES.BLOCKED },
          },
          { $set: { status: USER_STATUSES.NEW } }
        )
      : Promise.resolve({ modifiedCount: 0 }),
  ]);

  return {
    droppedUniqueOwnerIndexes,
    ownerIndexes: ownerIndexNames,
    ownerAccounts: ownerUsers.length,
    activeOwners: activeOwners.length,
    newOwners: newOwners.length,
    blockedOwners: blockedOwners.length,
    modifiedOwnerAccounts: activeUpdate.modifiedCount + newUpdate.modifiedCount,
    createdDemoOwnerAccounts,
    unresolvedOwnerIds: unresolvedOwnerIds.length,
    unresolvedOwnerIdSamples: unresolvedOwnerIds.slice(0, 10).map(String),
  };
}
