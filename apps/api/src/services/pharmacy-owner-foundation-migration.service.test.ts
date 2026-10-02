import assert from 'node:assert/strict';
import test from 'node:test';

import { migratePharmacyOwnerFoundation } from './pharmacy-owner-foundation-migration.service';

//===============================================================

type FakeIndex = {
  name: string;
  key: Record<string, 1 | -1>;
  unique?: boolean;
};

type FakeUser = {
  _id: string;
  role: string;
  status: string;
};

type FakePharmacy = {
  _id: string;
  ownerId: string;
  status: string;
  createdAt: Date;
};

//===============================================================

function sameKey(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

//===============================================================

function createFakeDatabase({
  indexes,
  users,
  pharmacies,
}: {
  indexes: FakeIndex[];
  users: FakeUser[];
  pharmacies: FakePharmacy[];
}) {
  const pharmacyIndexes = indexes.map((index) => ({ ...index }));

  const pharmacyCollection = {
    async indexes() {
      return pharmacyIndexes.map((index) => ({ ...index }));
    },

    async dropIndex(name: string) {
      const index = pharmacyIndexes.findIndex((item) => item.name === name);
      if (index < 0) throw new Error(`Unknown index ${name}`);
      pharmacyIndexes.splice(index, 1);
      return { ok: 1 };
    },

    async createIndex(key: Record<string, 1 | -1>, options: { name: string }) {
      const existing = pharmacyIndexes.find((index) => sameKey(index.key, key));
      if (existing) return existing.name;

      pharmacyIndexes.push({ name: options.name, key: { ...key } });
      return options.name;
    },

    async distinct(field: string, filter: Record<string, unknown>) {
      assert.equal(field, 'ownerId');

      const rows = pharmacies.filter((pharmacy) => {
        if ('status' in filter) return pharmacy.status === filter.status;
        return Boolean(pharmacy.ownerId);
      });

      return [...new Set(rows.map((pharmacy) => pharmacy.ownerId))];
    },
  };

  const userCollection = {
    find(filter: { _id: { $in: string[] } }) {
      const ids = new Set(filter._id.$in.map(String));
      return {
        async toArray() {
          return users
            .filter((user) => ids.has(String(user._id)))
            .map((user) => ({ ...user }));
        },
      };
    },

    async updateMany(
      filter: {
        _id: { $in: string[] };
        role: string;
        status: { $ne: string };
      },
      update: { $set: { status: string } }
    ) {
      const ids = new Set(filter._id.$in.map(String));
      let modifiedCount = 0;

      for (const user of users) {
        if (
          !ids.has(String(user._id)) ||
          user.role !== filter.role ||
          user.status === filter.status.$ne ||
          user.status === update.$set.status
        ) {
          continue;
        }

        user.status = update.$set.status;
        modifiedCount += 1;
      }

      return { modifiedCount };
    },
  };

  const database = {
    collection(name: string) {
      if (name === 'pharmacies') return pharmacyCollection;
      if (name === 'users') return userCollection;
      throw new Error(`Unexpected collection ${name}`);
    },
  } as unknown as Parameters<typeof migratePharmacyOwnerFoundation>[0];

  return { database, pharmacyIndexes, users, pharmacies };
}

//===============================================================

test('owner foundation migration is repeatable and keeps role-aware owner statuses', async () => {
  const fixture = createFakeDatabase({
    indexes: [
      { name: '_id_', key: { _id: 1 }, unique: true },
      { name: 'ownerId_1', key: { ownerId: 1 }, unique: true },
      {
        name: 'ownerId_1_status_1',
        key: { ownerId: 1, status: 1 },
      },
    ],
    users: [
      { _id: 'owner-a', role: 'pharmacy', status: 'active' },
      { _id: 'owner-b', role: 'pharmacy', status: 'active' },
      { _id: 'owner-c', role: 'pharmacy', status: 'blocked' },
      { _id: 'client-a', role: 'client', status: 'active' },
      { _id: 'admin-a', role: 'admin', status: 'active' },
    ],
    pharmacies: [
      {
        _id: 'pharmacy-a1',
        ownerId: 'owner-a',
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        _id: 'pharmacy-a2',
        ownerId: 'owner-a',
        status: 'new',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
      {
        _id: 'pharmacy-b1',
        ownerId: 'owner-b',
        status: 'on_verification',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        _id: 'pharmacy-c1',
        ownerId: 'owner-c',
        status: 'active',
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    ],
  });

  const first = await migratePharmacyOwnerFoundation(fixture.database);

  assert.equal(first.droppedUniqueOwnerIndexes, 1);
  assert.equal(first.ownerAccounts, 3);
  assert.equal(first.activeOwners, 1);
  assert.equal(first.newOwners, 1);
  assert.equal(first.blockedOwners, 1);
  assert.equal(first.modifiedOwnerAccounts, 1);
  assert.equal(first.unresolvedOwnerIds, 0);
  assert.deepEqual(first.unresolvedOwnerIdSamples, []);

  assert.equal(
    fixture.users.find((user) => user._id === 'owner-a')?.status,
    'active'
  );

  assert.equal(
    fixture.users.find((user) => user._id === 'owner-b')?.status,
    'new'
  );

  assert.equal(
    fixture.users.find((user) => user._id === 'owner-c')?.status,
    'blocked'
  );

  assert.equal(
    fixture.users.find((user) => user._id === 'client-a')?.status,
    'active'
  );

  assert.equal(
    fixture.users.find((user) => user._id === 'admin-a')?.status,
    'active'
  );

  const ownerIndexes = fixture.pharmacyIndexes.filter((index) =>
    Object.hasOwn(index.key, 'ownerId')
  );

  assert.equal(ownerIndexes.length, 3);
  assert.equal(
    ownerIndexes.some((index) => index.unique === true),
    false
  );

  assert.equal(
    fixture.pharmacies.filter((pharmacy) => pharmacy.ownerId === 'owner-a')
      .length,
    2
  );

  const second = await migratePharmacyOwnerFoundation(fixture.database);

  assert.equal(second.droppedUniqueOwnerIndexes, 0);
  assert.equal(second.modifiedOwnerAccounts, 0);
  assert.equal(second.unresolvedOwnerIds, 0);
  assert.deepEqual(second.ownerIndexes, first.ownerIndexes);
  assert.equal(fixture.pharmacyIndexes.length, 4);
});

//===============================================================

test('owner foundation migration skips unresolved legacy owner ids without synthesizing users', async () => {
  const fixture = createFakeDatabase({
    indexes: [
      { name: '_id_', key: { _id: 1 }, unique: true },
      { name: 'ownerId_1', key: { ownerId: 1 }, unique: true },
    ],
    users: [{ _id: 'owner-a', role: 'pharmacy', status: 'active' }],
    pharmacies: [
      {
        _id: 'pharmacy-a1',
        ownerId: 'owner-a',
        status: 'on_verification',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        _id: 'pharmacy-orphan',
        ownerId: 'missing-owner',
        status: 'active',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ],
  });

  const result = await migratePharmacyOwnerFoundation(fixture.database);

  assert.equal(result.ownerAccounts, 1);
  assert.equal(result.activeOwners, 0);
  assert.equal(result.newOwners, 1);
  assert.equal(result.blockedOwners, 0);
  assert.equal(result.modifiedOwnerAccounts, 1);
  assert.equal(result.unresolvedOwnerIds, 1);
  assert.deepEqual(result.unresolvedOwnerIdSamples, ['missing-owner']);

  assert.equal(
    fixture.users.find((user) => user._id === 'owner-a')?.status,
    'new'
  );

  assert.equal(
    fixture.users.some((user) => user._id === 'missing-owner'),
    false
  );

  const ownerIndexes = fixture.pharmacyIndexes.filter((index) =>
    Object.hasOwn(index.key, 'ownerId')
  );

  assert.equal(ownerIndexes.length, 3);
  assert.equal(
    ownerIndexes.some((index) => index.unique === true),
    false
  );
});

//===============================================================

test('owner foundation migration fails closed when Pharmacy.ownerId points to a non-pharmacy user', async () => {
  const fixture = createFakeDatabase({
    indexes: [],
    users: [{ _id: 'client-owner', role: 'client', status: 'active' }],
    pharmacies: [
      {
        _id: 'pharmacy-invalid',
        ownerId: 'client-owner',
        status: 'new',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  });

  await assert.rejects(
    () => migratePharmacyOwnerFoundation(fixture.database),
    /must reference role="pharmacy" users/
  );
});
