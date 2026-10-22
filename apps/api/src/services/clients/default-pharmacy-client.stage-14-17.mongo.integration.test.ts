import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose, { Types } from 'mongoose';

import { Client } from '../../models/client.model';
import { Pharmacy } from '../../models/pharmacy.model';
import { User } from '../../models/user.model';
import { ensureDefaultPharmacyClient } from './default-pharmacy-client.service';

//===================================================================

const mongoUri = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===================================================================

// Requires a disposable MongoDB test replica set, as do the moderation suites.
test(
  'Stage 14.17: default client upsert and reactivation preserve favorites and first activation timestamp',
  { skip: !mongoUri },

  async () => {
    await mongoose.connect(mongoUri!);

    const id = new Types.ObjectId();
    const marker = id.toHexString();

    const phoneDigits = (BigInt(`0x${marker}`) % 10_000_000n)
      .toString()
      .padStart(7, '0');

    const activatedAt = new Date('2026-10-01T09:00:00.000Z');

    let ownerId: Types.ObjectId | null = null;
    let pharmacyId: Types.ObjectId | null = null;
    let defaultClientId: Types.ObjectId | null = null;

    try {
      const owner = await User.create({
        name: 'Default client test owner',
        email: `default-client-owner-${marker}@example.test`,
        phone: `+38050${phoneDigits}`,
        password: 'test-hash-not-for-login',
        role: 'pharmacy',
        status: 'active',
      });

      ownerId = owner._id;

      const pharmacy = await Pharmacy.create({
        ownerId: owner._id,
        name: `Default client test ${marker}`,
        status: 'active',
        activatedAt,
        documents: [],
      });

      pharmacyId = pharmacy._id;

      const first = await ensureDefaultPharmacyClient(pharmacy._id, owner._id);

      assert.ok(first);
      defaultClientId = first._id;
      assert.equal(first.createdAt.toISOString(), activatedAt.toISOString());

      const favoritePharmacyId = new Types.ObjectId();
      const favoriteProductId = new Types.ObjectId();

      await Client.updateOne(
        { userId: first._id },
        {
          $set: {
            favoritePharmacyIds: [favoritePharmacyId],
            favoriteProductIds: [favoriteProductId],
          },
        }
      );

      const again = await ensureDefaultPharmacyClient(pharmacy._id, owner._id);

      assert.equal(String(again?._id), String(first._id));
      assert.equal(again?.createdAt.toISOString(), activatedAt.toISOString());

      assert.equal(
        await User.countDocuments({ defaultClientPharmacyId: pharmacy._id }),
        1
      );

      assert.equal(await Client.countDocuments({ userId: first._id }), 1);

      const saved = await Client.findOne({ userId: first._id }).lean();

      assert.equal(
        String(saved?.favoritePharmacyIds[0]),
        String(favoritePharmacyId)
      );

      assert.equal(
        String(saved?.favoriteProductIds[0]),
        String(favoriteProductId)
      );
    } finally {
      if (defaultClientId) {
        await Client.deleteMany({ userId: defaultClientId });
        await User.deleteMany({ _id: defaultClientId });
      }

      if (pharmacyId) await Pharmacy.deleteMany({ _id: pharmacyId });
      if (ownerId) await User.deleteMany({ _id: ownerId });

      await mongoose.disconnect();
    }
  }
);
