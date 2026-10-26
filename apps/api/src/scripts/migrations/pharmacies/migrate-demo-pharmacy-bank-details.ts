import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';

//===============================================================

// Non-destructive backfill for demo records created by older seed versions.
// Only demo e-pharmacy.example.com addresses are updated; existing real data is untouched.
dotenv.config();

//===============================================================

async function migrate(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, { autoIndex: false });

  try {
    const pharmacies = await Pharmacy.find({
      email: /^pharmacy\.\d+@e-pharmacy\.example\.com$/i,
      'bankDetails.recipientName': { $exists: true, $ne: '' },
      'bankDetails.iban': { $exists: true, $ne: '' },

      $or: [
        { 'bankDetails.receiptEmail': { $exists: false } },
        { 'bankDetails.receiptEmail': null },
        { 'bankDetails.receiptEmail': '' },
      ],
    }).select('_id email');

    let updated = 0;

    for (const pharmacy of pharmacies) {
      const email = pharmacy.email?.trim();

      if (!email) continue;

      const result = await Pharmacy.updateOne(
        {
          _id: pharmacy._id,
          $or: [
            { 'bankDetails.receiptEmail': { $exists: false } },
            { 'bankDetails.receiptEmail': null },
            { 'bankDetails.receiptEmail': '' },
          ],
        },

        { $set: { 'bankDetails.receiptEmail': email } },
        { runValidators: true }
      );

      updated += result.modifiedCount;
    }

    console.log(
      `Demo pharmacy bank details backfilled: ${updated}; examined: ${pharmacies.length}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===============================================================

void migrate().catch((error: unknown) => {
  console.error('Demo pharmacy bank details migration failed:', error);
  process.exitCode = 1;
});
