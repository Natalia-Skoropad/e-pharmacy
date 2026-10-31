import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyPaymentIdentifier } from '../../models/pharmacies/pharmacyPaymentIdentifier.model';

import {
  checkPaymentIdentifierDuplicates,
  ensurePharmacyPaymentUniqueIndex,
  syncPharmacyPaymentIdentifiers,
} from './pharmacy-payment-uniqueness.service';

//===================================================================

const uri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===================================================================

test(
  'global payment identifiers reject another owner, including reserved moderation values',
  { skip: !uri },
  async () => {
    await mongoose.connect(uri!);

    const ownerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();

    const taxId = String(
      Number.parseInt(ownerA.toHexString().slice(-7), 16) % 100_000_000
    ).padStart(8, '0');

    const iban = `UA${String(Number.parseInt(ownerB.toHexString().slice(-7), 16)).padStart(27, '0')}`;
    const receiptEmail = `pharmacy-${ownerA.toHexString().slice(-12)}@example.com`;
    const email = `owner-${ownerA.toHexString().slice(-12)}@example.com`;
    const phone = `+380${String(Number.parseInt(ownerA.toHexString().slice(-9), 16) % 1_000_000_000).padStart(9, '0')}`;
    const ids: Types.ObjectId[] = [];

    try {
      // Simulate the model's autoIndex path first: it creates `key_1`.
      // The explicit transactional safeguard must accept that same index.
      await PharmacyPaymentIdentifier.init();
      await ensurePharmacyPaymentUniqueIndex();

      const keyIndexes = (
        await PharmacyPaymentIdentifier.collection.indexes()
      ).filter(
        (index) => index.key.key === 1 && Object.keys(index.key).length === 1
      );

      assert.ok(
        keyIndexes.some((index) => index.unique === true && !index.sparse)
      );

      const a = await Pharmacy.create({
        ownerId: ownerA,
        name: 'First test pharmacy',
        status: 'new',
        bankDetails: { taxId, receiptEmail },
        phone,
        email,
      });

      ids.push(a._id);

      const b = await Pharmacy.create({
        ownerId: ownerB,
        name: 'Second test pharmacy',
        status: 'new',
      });

      ids.push(b._id);

      const saveWithReservations = async (
        pharmacyId: Types.ObjectId,
        pendingIban?: string
      ) => {
        const session = await mongoose.startSession();

        try {
          await session.withTransaction(async () => {
            const pharmacy =
              await Pharmacy.findById(pharmacyId).session(session);

            assert.ok(pharmacy);

            if (pendingIban) {
              pharmacy.pendingModeration = {
                bankDetails: { iban: pendingIban },
              };

              await pharmacy.save({ session });
            }

            await syncPharmacyPaymentIdentifiers(pharmacy, session);
          });
        } finally {
          await session.endSession();
        }
      };

      await saveWithReservations(a._id, iban);

      // The same owner may share identifiers across pharmacies. The unique
      // reservation still excludes a different owner's pharmacy.
      const sameOwner = await Pharmacy.create({
        ownerId: ownerA,
        name: 'Another pharmacy of the same owner',
        status: 'new',
        bankDetails: { taxId, receiptEmail },
        phone,
        email,
      });

      ids.push(sameOwner._id);

      await saveWithReservations(sameOwner._id);

      assert.deepEqual(
        await checkPaymentIdentifierDuplicates(String(sameOwner._id), {
          taxId,
          receiptEmail,
          phone,
          email,
        }),

        { taxId: false, receiptEmail: false, phone: false, email: false }
      );

      assert.deepEqual(
        await checkPaymentIdentifierDuplicates(String(b._id), { phone, email }),
        { phone: true, email: true }
      );

      assert.deepEqual(
        await checkPaymentIdentifierDuplicates(String(b._id), {
          taxId,
          iban,
          receiptEmail,
        }),

        { taxId: true, iban: true, receiptEmail: true }
      );

      assert.deepEqual(
        await checkPaymentIdentifierDuplicates(String(a._id), {
          taxId,
          iban,
          receiptEmail,
        }),

        { taxId: false, iban: false, receiptEmail: false }
      );

      await assert.rejects(
        () => saveWithReservations(b._id, iban),

        (error: unknown) =>
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'PHARMACY_PAYMENT_IDENTIFIER_DUPLICATE'
      );

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const pharmacy = await Pharmacy.findById(a._id).session(session);

          assert.ok(pharmacy);
          pharmacy.pendingModeration = undefined;

          await pharmacy.save({ session });
          await syncPharmacyPaymentIdentifiers(pharmacy, session);
        });
      } finally {
        await session.endSession();
      }

      assert.deepEqual(
        await checkPaymentIdentifierDuplicates(String(b._id), { iban }),
        { iban: false }
      );
      await saveWithReservations(b._id, iban);
    } finally {
      await PharmacyPaymentIdentifier.deleteMany({ pharmacyId: { $in: ids } });
      await Pharmacy.deleteMany({ _id: { $in: ids } });
      await mongoose.disconnect();
    }
  }
);
