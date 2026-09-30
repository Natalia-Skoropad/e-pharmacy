import mongoose from 'mongoose';

import { env } from '../config/env';
import { prepareProductCategoryMigration } from '../services/product-category-migration.service';

//===============================================================

async function migrateProductCategories(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is unavailable.');

  const result = await prepareProductCategoryMigration(db);

  console.log(
    `ProductCategory migration preflight completed: ${result.seededCreatedCount} category record(s) created.`
  );
  console.log(
    `Legacy category mappings prepared: ${result.categorySlugs.join(', ') || 'none'}.`
  );

  if (result.legacyCustomProductRequests > 0) {
    console.log(
      `${result.legacyCustomProductRequests} legacy custom ProductRequest record(s) kept for Stage 11.3; no "Other" ProductCategory was created.`
    );
  }
}

//===============================================================

void migrateProductCategories()
  .catch((error: unknown) => {
    console.error('ProductCategory migration preflight failed.');

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
