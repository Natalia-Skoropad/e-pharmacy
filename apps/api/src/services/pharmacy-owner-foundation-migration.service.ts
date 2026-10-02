import type { Connection } from 'mongoose';

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

export type PharmacyOwnerFoundationMigrationResult = Readonly<{
  droppedUniqueOwnerIndexes: number;
  ownerIndexes: readonly string[];
  ownerAccounts: number;
  activeOwners: number;
  newOwners: number;
  blockedOwners: number;
  modifiedOwnerAccounts: number;
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

export async function migratePharmacyOwnerFoundation(
  db: Database
): Promise<PharmacyOwnerFoundationMigrationResult> {
  const pharmacies = db.collection('pharmacies');
  const users = db.collection('users');

  const ownerIds = await pharmacies.distinct('ownerId', {
    ownerId: { $exists: true, $ne: null },
  });

  const ownerUsers =
    ownerIds.length > 0
      ? await users
          .find(
            { _id: { $in: ownerIds } },
            { projection: { _id: 1, role: 1, status: 1 } }
          )
          .toArray()
      : [];

  const foundOwnerIdSet = objectIdSet(ownerUsers.map((owner) => owner._id));
  const unresolvedOwnerIds = ownerIds.filter(
    (ownerId) => !foundOwnerIdSet.has(String(ownerId))
  );

  const invalidRoleOwners = ownerUsers.filter(
    (owner) => owner.role !== USER_ROLES.PHARMACY
  );

  if (invalidRoleOwners.length > 0) {
    throw new Error(
      `Cannot migrate pharmacy owners because Pharmacy.ownerId must reference role="pharmacy" users. Invalid owner ids: ${invalidRoleOwners.map((owner) => String(owner._id)).join(', ')}.`
    );
  }

  // Index migration is intentionally independent from legacy orphan references.
  // We must not synthesize or delete users/pharmacies just to make old data fit
  // the new relation. Existing resolvable owners are migrated; unresolved owner
  // ids are reported to the caller for follow-up cleanup.
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
    unresolvedOwnerIds: unresolvedOwnerIds.length,
    unresolvedOwnerIdSamples: unresolvedOwnerIds.slice(0, 10).map(String),
  };
}
