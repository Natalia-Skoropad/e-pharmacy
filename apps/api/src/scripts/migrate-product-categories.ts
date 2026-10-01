import mongoose from 'mongoose';

import { env } from '../config/env';
import { migrateProductCategoryRelations } from '../services/product-category-migration.service';

//===============================================================

async function migrateProductCategories(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is unavailable.');

  const result = await migrateProductCategoryRelations(db);

  console.log(
    `Product category relation migration completed: ${result.seededCreatedCount} category record(s) created, ${result.migratedProducts} product(s), ${result.migratedProductRequests} product request(s), and ${result.migratedOrderSnapshots} order snapshot(s) migrated.`
  );

  console.log(
    `Resolved category slugs: ${result.categorySlugs.join(', ') || 'none'}.`
  );

  if (result.legacyCustomProductRequests > 0) {
    console.log(
      `${result.legacyCustomProductRequests} legacy custom ProductRequest record(s) migrated to categoryMode="custom"; no "Other" ProductCategory was created.`
    );
  }
}

//===============================================================

void migrateProductCategories()
  .catch((error: unknown) => {
    console.error('Product category relation migration failed.');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })

  .finally(async () => {
    await mongoose.disconnect();
  });
