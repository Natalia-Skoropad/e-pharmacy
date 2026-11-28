import 'dotenv/config';
import mongoose from 'mongoose';

//===================================================================

// Index-only repair for the current product request lifecycle. Never migrate
// business records here: the legacy status conversion is a separate command.
const INDEX_NAME = 'article_1';
const ACTIVE_STATUSES = ['new', 'on_moderation', 'approved'];

const partialFilterExpression = {
  status: { $in: ACTIVE_STATUSES },
  article: { $gt: '' },
};

//===================================================================

async function main(): Promise<void> {
  const testDatabase = process.argv.includes('--test-db');
  const apply = process.argv.includes('--apply');

  const uri = (
    testDatabase
      ? process.env.E_PHARMACY_TEST_MONGODB_URI
      : process.env.MONGODB_URI
  )?.trim();

  if (!uri) throw new Error('Selected MongoDB URI is required.');

  if (testDatabase && uri === process.env.MONGODB_URI?.trim()) {
    throw new Error('Test URI must not equal the application URI.');
  }

  if (
    apply &&
    process.env.NODE_ENV === 'production' &&
    !process.argv.includes('--production-approved')
  ) {
    throw new Error('Production requires explicit approval and a backup.');
  }

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    const db = mongoose.connection.db;

    if (!db) throw new Error('Database connection unavailable.');

    const collection = db.collection('productrequests');

    const collectionExists = await db
      .listCollections({ name: 'productrequests' }, { nameOnly: true })
      .hasNext();

    const existing = collectionExists
      ? (await collection.indexes()).find((index) => index.name === INDEX_NAME)
      : undefined;

    const partial = existing?.partialFilterExpression as
      | { article?: { $gt?: string }; status?: { $in?: string[] } }
      | undefined;

    const ready =
      existing?.unique === true &&
      existing.key.article === 1 &&
      Object.keys(existing.key).length === 1 &&
      partial?.article?.$gt === '' &&
      JSON.stringify([...(partial.status?.$in ?? [])].sort()) ===
        JSON.stringify([...ACTIVE_STATUSES].sort()) &&
      Object.keys(partial).length === 2;

    const legacyCount = await collection.countDocuments({
      status: { $in: ['draft', 'in_progress'] },
    });

    const duplicates = await collection
      .aggregate([
        { $match: partialFilterExpression },
        { $group: { _id: '$article', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 1 },
      ])
      .hasNext();

    console.log(
      JSON.stringify({
        database: db.databaseName,
        target: testDatabase ? 'test' : 'application',
        mode: apply ? 'apply' : 'preview',
        index: INDEX_NAME,
        ready,
        legacyCount,
        duplicateArticles: duplicates,
      })
    );

    if (legacyCount || duplicates) {
      throw new Error(
        'Legacy statuses or duplicate articles require manual review; no index changes made.'
      );
    }

    if (!apply || ready) return;

    // This is an explicit maintenance operation. Stop writers and back up the
    // selected database before applying; index DDL is not transactional.
    if (existing) await collection.dropIndex(INDEX_NAME);

    await collection.createIndex(
      { article: 1 },
      { name: INDEX_NAME, unique: true, partialFilterExpression }
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
