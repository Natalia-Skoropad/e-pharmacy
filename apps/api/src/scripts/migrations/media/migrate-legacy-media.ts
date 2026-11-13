import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';
import { Product } from '../../../models/catalog/product.model';
import { ProductRequest } from '../../../models/catalog/productRequest.model';
import { storeManagedPhoto } from '../../../services/media/managed-photo.service';

//===================================================================

dotenv.config();

//===================================================================

// Safe opt-in migration: dry-run by default, apply only with --apply.
// It never deletes existing data and updates fields with compare-and-swap.
const apply = process.argv.includes('--apply');
const DATA_IMAGE = /^data:image\/(?:jpeg|png|webp);base64,/i;
const limitFlag = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitFlag ? Number(limitFlag.slice('--limit='.length)) : Infinity;

if (!(limit > 0)) throw new Error('--limit must be positive');

//===================================================================

async function main(): Promise<void> {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });

  let found = 0;
  let migrated = 0;
  let failed = 0;

  const migrateField = async (
    model: typeof Pharmacy | typeof Product | typeof ProductRequest,
    field: 'imageUrl' | 'pendingModeration.imageUrl' | 'productImage.dataUrl'
  ) => {
    const query = { [field]: DATA_IMAGE };

    const collection = mongoose.connection.db!.collection(
      model.collection.collectionName
    );

    const cursor = collection.find(query, {
      projection: { _id: 1, [field.split('.')[0]]: 1 },
    });

    for await (const record of cursor) {
      if (found >= limit) break;

      const value = field
        .split('.')
        .reduce<unknown>(
          (current, part) =>
            current && typeof current === 'object'
              ? (current as Record<string, unknown>)[part]
              : undefined,
          record
        );

      if (typeof value !== 'string' || !DATA_IMAGE.test(value)) continue;
      found++;

      if (!apply) continue;

      try {
        const { url } = await storeManagedPhoto(value);

        // Compare-and-swap protects concurrent owner/admin edits.
        const result = await collection.updateOne(
          { _id: record._id, [field]: value },
          { $set: { [field]: url } }
        );

        if (result.modifiedCount) migrated++;
        else
          console.warn(
            `Skipped concurrently modified ${model.modelName}/${record._id}/${field}`
          );
      } catch (error) {
        failed++;

        console.error(
          `Cannot migrate ${model.modelName}/${record._id}/${field}:`,
          error
        );
      }
    }
  };

  try {
    await migrateField(Pharmacy, 'imageUrl');
    await migrateField(Pharmacy, 'pendingModeration.imageUrl');
    await migrateField(Product, 'imageUrl');
    await migrateField(ProductRequest, 'productImage.dataUrl');

    console.log(
      JSON.stringify({
        mode: apply ? 'apply' : 'dry-run',
        found,
        migrated,
        failed,
      })
    );

    if (failed) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

void main().catch((error: unknown) => {
  console.error('Media migration failed:', error);
  process.exitCode = 1;
});
