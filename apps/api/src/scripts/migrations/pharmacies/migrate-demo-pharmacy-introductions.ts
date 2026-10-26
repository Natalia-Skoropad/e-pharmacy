import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';

import {
  DEMO_REGIONS,
  createDemoPharmacyShortDescription,
} from '../../../constants/fixtures/demo-pharmacy-profiles';

//===================================================================

// Idempotent, non-destructive backfill. Never use seed:api on a working DB
// merely to add test location and introduction fields.
dotenv.config();

//===================================================================

const DEMO_ACCOUNT_EMAILS = [
  'nata5@ukr.net',
  'care_pharmacy@ukr.net',
  'nata7@ukr.net',
];

//===================================================================

async function migrate(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, { autoIndex: false });

  try {
    const demoPharmacies = await Pharmacy.find({
      $or: [
        { email: /^pharmacy\.\d+@e-pharmacy\.example\.com$/i },
        { email: { $in: DEMO_ACCOUNT_EMAILS } },
      ],
    }).select(
      '_id name email location.settlement location.region shortDescription'
    );

    let descriptionsAdded = 0;
    let regionsAdded = 0;

    for (const pharmacy of demoPharmacies) {
      const email = pharmacy.email?.trim().toLowerCase() ?? '';

      const demoNumber = /^pharmacy\.(\d+)@e-pharmacy\.example\.com$/.exec(
        email
      );

      if (
        demoNumber &&
        (Number(demoNumber[1]) < 1 || Number(demoNumber[1]) > 98)
      )
        continue;

      const updates: Record<string, string> = {};
      const name = pharmacy.name?.trim();
      const settlement = pharmacy.location?.settlement?.trim();
      const region = settlement ? DEMO_REGIONS[settlement] : undefined;

      if (!pharmacy.shortDescription?.trim() && name) {
        updates.shortDescription = createDemoPharmacyShortDescription(name);
      }

      if (!pharmacy.location?.region?.trim() && region) {
        updates['location.region'] = region;
      }

      // Conditions are evaluated per field so a concurrent change to either
      // field cannot be overwritten. Preserve existing content and locations.
      for (const [field, value] of Object.entries(updates)) {
        const condition =
          field === 'shortDescription'
            ? {
                $or: [
                  { shortDescription: { $exists: false } },
                  { shortDescription: null },
                  { shortDescription: '' },
                ],
              }
            : {
                $or: [
                  { 'location.region': { $exists: false } },
                  { 'location.region': null },
                  { 'location.region': '' },
                ],
              };
        const result = await Pharmacy.updateOne(
          { _id: pharmacy._id, ...condition },
          { $set: { [field]: value } },
          { runValidators: true }
        );

        if (field === 'shortDescription')
          descriptionsAdded += result.modifiedCount;
        else regionsAdded += result.modifiedCount;
      }
    }

    console.log(
      `Demo pharmacy introductions: examined ${demoPharmacies.length}, ` +
        `short descriptions added ${descriptionsAdded}, regions added ${regionsAdded}.`
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

void migrate().catch((error: unknown) => {
  console.error('Demo pharmacy introductions migration failed:', error);
  process.exitCode = 1;
});
