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
  name?: string;
  email?: string;
  password?: string;
  role: string;
  status: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type FakePharmacy = {
  _id: string;
  ownerId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  createdAt: Date;
};

const MIGRATION_OPTIONS = {
  demoOwnerPasswordHash: 'hashed-demo-password',
} as const;

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

    find(filter: { ownerId?: { $in?: string[] } }) {
      const ownerIds = new Set((filter.ownerId?.$in ?? []).map(String));
      let rows = pharmacies.filter((pharmacy) =>
        ownerIds.has(String(pharmacy.ownerId))
      );

      const cursor = {
        sort() {
          rows = [...rows].sort(
            (left, right) =>
              left.createdAt.getTime() - right.createdAt.getTime() ||
              String(left._id).localeCompare(String(right._id))
          );
          return cursor;
        },
        async toArray() {
          return rows.map((pharmacy) => ({ ...pharmacy }));
        },
      };

      return cursor;
    },
  };

  const userCollection = {
    find(
      filter:
        | { _id: { $in: string[] } }
        | {
            $or: Array<
              { email: { $in: string[] } } | { phone: { $in: string[] } }
            >;
          }
    ) {
      return {
        async toArray() {
          if ('_id' in filter) {
            const ids = new Set(filter._id.$in.map(String));
            return users
              .filter((user) => ids.has(String(user._id)))
              .map((user) => ({ ...user }));
          }

          const emails = new Set<string>();
          const phones = new Set<string>();

          for (const clause of filter.$or) {
            if ('email' in clause) {
              clause.email.$in.forEach((email) => emails.add(email));
            }
            if ('phone' in clause) {
              clause.phone.$in.forEach((phone) => phones.add(phone));
            }
          }

          return users
            .filter(
              (user) =>
                (Boolean(user.email) && emails.has(String(user.email))) ||
                (Boolean(user.phone) && phones.has(String(user.phone)))
            )
            .map((user) => ({ ...user }));
        },
      };
    },

    async insertMany(documents: FakeUser[]) {
      users.push(...documents.map((document) => ({ ...document })));
      return { insertedCount: documents.length };
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

  const first = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(first.droppedUniqueOwnerIndexes, 1);
  assert.equal(first.ownerAccounts, 3);
  assert.equal(first.activeOwners, 1);
  assert.equal(first.newOwners, 1);
  assert.equal(first.blockedOwners, 1);
  assert.equal(first.modifiedOwnerAccounts, 1);
  assert.equal(first.createdDemoOwnerAccounts, 0);
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

  const second = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(second.droppedUniqueOwnerIndexes, 0);
  assert.equal(second.modifiedOwnerAccounts, 0);
  assert.equal(second.createdDemoOwnerAccounts, 0);
  assert.equal(second.unresolvedOwnerIds, 0);
  assert.deepEqual(second.ownerIndexes, first.ownerIndexes);
  assert.equal(fixture.pharmacyIndexes.length, 4);
});

//===============================================================

test('owner foundation migration creates missing Users for controlled demo pharmacies without changing owner ids', async () => {
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
        _id: 'pharmacy-demo',
        ownerId: 'missing-demo-owner',
        name: 'Family Health Pharmacy Kyiv 41',
        email: 'pharmacy.41@e-pharmacy.example.com',
        phone: '+380501000041',
        address: '52 Central Street',
        status: 'active',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ],
  });

  const result = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(result.ownerAccounts, 2);
  assert.equal(result.activeOwners, 1);
  assert.equal(result.newOwners, 1);
  assert.equal(result.blockedOwners, 0);
  assert.equal(result.createdDemoOwnerAccounts, 1);
  assert.equal(result.unresolvedOwnerIds, 0);

  const createdOwner = fixture.users.find(
    (user) => user._id === 'missing-demo-owner'
  );

  assert.ok(createdOwner);
  assert.equal(createdOwner.role, 'pharmacy');
  assert.equal(createdOwner.status, 'active');
  assert.equal(createdOwner.email, 'pharmacy.41@e-pharmacy.example.com');
  assert.equal(createdOwner.phone, '+380501000041');
  assert.equal(createdOwner.password, MIGRATION_OPTIONS.demoOwnerPasswordHash);

  assert.equal(
    fixture.pharmacies.find((pharmacy) => pharmacy._id === 'pharmacy-demo')
      ?.ownerId,
    'missing-demo-owner'
  );

  const second = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(second.createdDemoOwnerAccounts, 0);
  assert.equal(second.unresolvedOwnerIds, 0);
  assert.equal(
    fixture.users.filter((user) => user._id === 'missing-demo-owner').length,
    1
  );
});

//===============================================================

test('owner foundation migration repairs all 98 original client demo pharmacies idempotently', async () => {
  const pharmacies: FakePharmacy[] = Array.from({ length: 98 }, (_, index) => {
    const number = index + 1;

    return {
      _id: `demo-pharmacy-${number}`,
      ownerId: `demo-owner-${number}`,
      name: `Demo Pharmacy Kyiv ${number}`,
      email: `pharmacy.${number}@e-pharmacy.example.com`,
      ...(number === 1
        ? {}
        : {
            phone: `+380${String(501000000 + number).padStart(9, '0')}`,
          }),
      address: `${12 + index} Central Street`,
      status: 'active',
      createdAt: new Date(2026, 0, number),
    };
  });

  const fixture = createFakeDatabase({
    indexes: [{ name: 'ownerId_1', key: { ownerId: 1 }, unique: true }],
    users: [],
    pharmacies,
  });

  const first = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(first.createdDemoOwnerAccounts, 98);
  assert.equal(first.ownerAccounts, 98);
  assert.equal(first.activeOwners, 98);
  assert.equal(first.newOwners, 0);
  assert.equal(first.unresolvedOwnerIds, 0);
  assert.equal(fixture.users.length, 98);
  assert.equal(
    fixture.users.find((user) => user._id === 'demo-owner-1')?.phone,
    '+380501000001'
  );
  assert.equal(fixture.pharmacies.length, 98);
  assert.equal(
    fixture.pharmacies.every((pharmacy) =>
      fixture.users.some((user) => user._id === pharmacy.ownerId)
    ),
    true
  );

  const second = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(second.createdDemoOwnerAccounts, 0);
  assert.equal(second.modifiedOwnerAccounts, 0);
  assert.equal(second.unresolvedOwnerIds, 0);
  assert.equal(fixture.users.length, 98);
});

//===============================================================

test('owner foundation migration keeps unknown non-demo orphan references unresolved', async () => {
  const fixture = createFakeDatabase({
    indexes: [],
    users: [],
    pharmacies: [
      {
        _id: 'pharmacy-unknown',
        ownerId: 'missing-real-owner',
        name: 'Unknown Pharmacy',
        email: 'contact@unknown-pharmacy.com',
        phone: '+380501999999',
        status: 'active',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ],
  });

  const result = await migratePharmacyOwnerFoundation(
    fixture.database,
    MIGRATION_OPTIONS
  );

  assert.equal(result.ownerAccounts, 0);
  assert.equal(result.createdDemoOwnerAccounts, 0);
  assert.equal(result.unresolvedOwnerIds, 1);
  assert.deepEqual(result.unresolvedOwnerIdSamples, ['missing-real-owner']);
  assert.equal(fixture.users.length, 0);
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
    () => migratePharmacyOwnerFoundation(fixture.database, MIGRATION_OPTIONS),
    /must reference role="pharmacy" users/
  );
});
