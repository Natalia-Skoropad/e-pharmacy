import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { AdminAuditLog } from './adminAuditLog.model';
import { Order } from './order.model';
import { Pharmacy } from './pharmacy.model';
import { PharmacyReview } from './pharmacyReview.model';
import { ProductReview } from './productReview.model';
import { User } from './user.model';

//===============================================================

type PharmacySchemaIndex = ReturnType<typeof Pharmacy.schema.indexes>[number];

type AdminAuditSchemaIndex = ReturnType<
  typeof AdminAuditLog.schema.indexes
>[number];

type ReviewSchemaIndex = ReturnType<
  typeof ProductReview.schema.indexes
>[number];

//===============================================================

const validWorkingHours = [
  'Mon: 09:00-18:00',
  'Tue: 09:00-18:00',
  'Wed: 09:00-18:00',
  'Thu: 09:00-18:00',
  'Fri: 09:00-18:00',
  'Sat: Closed',
  'Sun: Closed',
].join('; ');

//===============================================================

test('User model enforces the same name, email, phone and address invariants as Zod', () => {
  const validUser = new User({
    name: 'Natalia',
    email: ' NATALIA@EXAMPLE.COM ',
    password: 'password123',
    phone: '+380501234567',
    address: 'Kyiv, Main Street 10',
  });

  assert.equal(validUser.validateSync(), undefined);
  assert.equal(validUser.email, 'natalia@example.com');

  validUser.name = 'N';
  assert.ok(validUser.validateSync()?.errors.name);

  validUser.name = 'Natalia';
  validUser.email = 'invalid email';
  assert.ok(validUser.validateSync()?.errors.email);

  validUser.email = 'natalia@example.com';
  validUser.address = 'short';
  assert.ok(validUser.validateSync()?.errors.address);
});

//===============================================================

test('User model allows new only for pharmacy accounts', () => {
  const base = {
    name: 'Owner Status',
    email: 'owner-status@example.com',
    password: 'password123',
    phone: '+380501234568',
  };

  const pharmacyOwner = new User({
    ...base,
    role: 'pharmacy',
    status: 'new',
  });

  assert.equal(pharmacyOwner.validateSync(), undefined);

  const client = new User({
    ...base,
    email: 'client-status@example.com',
    phone: '+380501234569',
    role: 'client',
    status: 'new',
  });

  assert.ok(client.validateSync()?.errors.status);

  const admin = new User({
    ...base,
    email: 'admin-status@example.com',
    phone: '+380501234570',
    role: 'admin',
    status: 'new',
  });

  assert.ok(admin.validateSync()?.errors.status);
});

//===============================================================

test('Pharmacy owner indexes are non-unique and support one owner with many pharmacies', () => {
  const indexes = Pharmacy.schema.indexes();

  const ownerOnly = indexes.find(
    ([keys]: PharmacySchemaIndex) =>
      Object.keys(keys).length === 1 && keys.ownerId === 1
  );

  const ownerStatus = indexes.find(
    ([keys]: PharmacySchemaIndex) => keys.ownerId === 1 && keys.status === 1
  );

  const ownerCreatedAt = indexes.find(
    ([keys]: PharmacySchemaIndex) => keys.ownerId === 1 && keys.createdAt === -1
  );

  assert.ok(ownerOnly);
  assert.ok(ownerStatus);
  assert.ok(ownerCreatedAt);
  assert.notEqual(ownerOnly[1].unique, true);
  assert.notEqual(ownerStatus[1].unique, true);
  assert.notEqual(ownerCreatedAt[1].unique, true);
});

//===============================================================

test('Pharmacy model stores location canonically and indexes settlement/address instead of legacy city/address fields', () => {
  assert.equal(Pharmacy.schema.path('address'), undefined);
  assert.equal(Pharmacy.schema.path('city'), undefined);
  assert.ok(Pharmacy.schema.path('location.address'));
  assert.ok(Pharmacy.schema.path('location.settlement'));
  assert.ok(Pharmacy.schema.path('location.countryCode'));

  const indexes = Pharmacy.schema.indexes();

  const locationText = indexes.find(
    ([keys, options]: PharmacySchemaIndex) =>
      options.name === 'pharmacy_location_text' &&
      keys.name === 'text' &&
      keys['location.address'] === 'text' &&
      keys['location.settlement'] === 'text'
  );

  const settlement = indexes.find(
    ([keys, options]: PharmacySchemaIndex) =>
      options.name === 'pharmacy_location_settlement' &&
      keys['location.settlement'] === 1
  );

  assert.ok(locationText);
  assert.ok(settlement);
});

//===============================================================

test('Order pharmacy snapshots write canonical location while retaining legacy history fields', () => {
  assert.ok(Order.schema.path('pharmacySnapshot.location.address'));
  assert.ok(Order.schema.path('pharmacySnapshot.location.settlement'));
  assert.ok(Order.schema.path('pharmacySnapshot.location.region'));
  assert.ok(Order.schema.path('pharmacySnapshot.location.countryCode'));

  assert.ok(Order.schema.path('pharmacySnapshot.address'));
  assert.ok(Order.schema.path('pharmacySnapshot.city'));
});

//===============================================================

test('Admin audit model expires Activity history after at most three years', () => {
  const retentionIndex = AdminAuditLog.schema
    .indexes()
    .find(
      ([keys, options]: AdminAuditSchemaIndex) =>
        keys.createdAt === 1 && options.name === 'admin_audit_retention_ttl'
    );

  assert.ok(retentionIndex);
  assert.equal(retentionIndex[1].expireAfterSeconds, 94_608_000);
});

//===============================================================

test('Pharmacy model protects contact, schedule, bank and picture invariants', () => {
  const pharmacy = new Pharmacy({
    ownerId: new Types.ObjectId(),
    name: 'Health Pharmacy',

    location: {
      address: 'Kyiv, Main Street 10',
      settlement: 'Kyiv',
      countryCode: 'UA',
    },

    phone: '+380501234567',
    email: ' CONTACT@EXAMPLE.COM ',
    workingHours: validWorkingHours,
    imageUrl: 'https://example.com/pharmacy.webp',

    bankDetails: {
      recipientName: 'Health Pharmacy LLC',
      taxId: '12345678',
      iban: 'ua123456789012345678901234567',
      bankName: 'Example Bank',
      paymentPurpose: 'Payment for medicines',
      receiptEmail: ' BILLING@EXAMPLE.COM ',
    },
  });

  assert.equal(pharmacy.validateSync(), undefined);
  assert.equal(pharmacy.email, 'contact@example.com');
  assert.equal(pharmacy.bankDetails?.iban, 'UA123456789012345678901234567');
  assert.equal(pharmacy.bankDetails?.receiptEmail, 'billing@example.com');

  pharmacy.phone = '0501234567';
  assert.ok(pharmacy.validateSync()?.errors.phone);

  pharmacy.phone = '+380501234567';
  pharmacy.workingHours = 'Open every day';
  assert.ok(pharmacy.validateSync()?.errors.workingHours);

  pharmacy.workingHours = validWorkingHours;
  pharmacy.imageUrl = 'blob:https://example.com/preview';
  assert.ok(pharmacy.validateSync()?.errors.imageUrl);
});

//===============================================================

test('Review model rejects comments outside the shared character contract', () => {
  const review = new ProductReview({
    productId: new Types.ObjectId(),
    userName: 'Natalia',
    rating: 5,
    comment: 'Excellent service and quick delivery',
  });

  assert.equal(review.validateSync(), undefined);

  review.comment = 'Чудовий сервіс і швидка доставка';
  assert.ok(review.validateSync()?.errors.comment);
});

//===============================================================

test('Review models enforce one pending or approved review per user and entity', () => {
  for (const [model, entityKey] of [
    [ProductReview, 'productId'],
    [PharmacyReview, 'pharmacyId'],
  ] as const) {
    const matchingIndex = model.schema
      .indexes()
      .find(
        ([keys, options]: ReviewSchemaIndex) =>
          keys[entityKey] === 1 && keys.userId === 1 && options.unique === true
      );

    assert.ok(matchingIndex);

    assert.deepEqual(matchingIndex[1].partialFilterExpression?.status, {
      $in: ['on_moderation', 'approved'],
    });
  }
});
