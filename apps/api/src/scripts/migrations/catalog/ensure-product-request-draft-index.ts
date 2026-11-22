import 'dotenv/config';
import mongoose from 'mongoose';

import { ProductRequest } from '../../../models/catalog/productRequest.model';

//===================================================================

// Run after deploying name-only product request drafts, before creating them.
// The legacy unique index also indexed missing/empty articles, which would
// allow only one name-only draft per database. This migration changes only the
// index and never changes existing product requests.
const INDEX_NAME = 'article_1';
const ACTIVE_STATUSES = ['draft', 'new', 'in_progress', 'approved'];

//===================================================================

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    const collection = ProductRequest.collection;

    const existing = (await collection.indexes()).find(
      (index) => index.name === INDEX_NAME
    );

    const partial = existing?.partialFilterExpression as
      | { article?: { $gt?: string } }
      | undefined;

    if (partial?.article?.$gt === '' && existing?.unique === true) {
      console.log(
        JSON.stringify({ index: INDEX_NAME, status: 'already-ready' })
      );
      return;
    }

    if (existing) await collection.dropIndex(INDEX_NAME);

    await collection.createIndex(
      { article: 1 },
      {
        name: INDEX_NAME,
        unique: true,
        partialFilterExpression: {
          status: { $in: ACTIVE_STATUSES },
          article: { $gt: '' },
        },
      }
    );

    console.log(JSON.stringify({ index: INDEX_NAME, status: 'ready' }));
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

main().catch((error: unknown) => {
  // Never print a raw connection error: Mongo URIs can contain credentials.
  const failure = error as { name?: string; code?: string | number };

  console.error(
    JSON.stringify({
      migration: 'product-request-draft-index',
      status: 'failed',
      type: failure.name ?? 'Error',
      code: failure.code ?? null,
    })
  );

  process.exitCode = 1;
});
