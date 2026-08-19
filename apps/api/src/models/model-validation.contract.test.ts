import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { Pharmacy } from './pharmacy.model';
import { PharmacyReview } from './pharmacyReview.model';
import { ProductReview } from './productReview.model';
import { User } from './user.model';

//===============================================================

type ReviewSchemaIndex = ReturnType<typeof ProductReview.schema.indexes>[number];

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

test('Pharmacy model protects contact, schedule, bank and picture invariants', () => {
  const pharmacy = new Pharmacy({
    ownerId: new Types.ObjectId(),
    name: 'Health Pharmacy',
    address: 'Kyiv, Main Street 10',
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
