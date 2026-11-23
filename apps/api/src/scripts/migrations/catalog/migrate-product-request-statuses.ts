import 'dotenv/config';
import mongoose from 'mongoose';

//===================================================================

/**
 * One-time status conversion, safe to retry. Run before deploying the new
 * lifecycle: legacy "new" meant already submitted, while the new "new" means
 * editable and not submitted.
 *
 * Preview (no writes): pnpm --filter @e-pharmacy/api migrate:product-request-statuses
 * Apply (after DB backup): pnpm --filter @e-pharmacy/api migrate:product-request-statuses -- --apply
 */
const KEY = 'product-request-statuses-2026-11-v2';
const INDEX_NAME = 'article_1';

const partialFilterExpression = {
  status: { $in: ['new', 'on_moderation', 'approved'] },
  article: { $gt: '' },
};

//===================================================================

async function main() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required.');

  const apply = process.argv.includes('--apply');

  if (
    apply &&
    process.env.NODE_ENV === 'production' &&
    !process.argv.includes('--production-approved')
  ) {
    throw new Error(
      'Production requires --production-approved and a verified database backup.'
    );
  }

  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });

  try {
    const db = mongoose.connection.db;

    if (!db) throw new Error('Database connection unavailable.');

    const requests = db.collection('productrequests');

    const markers = db.collection<{
      _id: string;
      appliedAt: Date;
      draft: number;
      submitted: number;
      inProgress: number;
    }>('migration_state');

    const completed = await markers.findOne({ _id: KEY });

    const [draft, submitted, inProgress] = await Promise.all([
      requests.countDocuments({ status: 'draft' }),
      requests.countDocuments({ status: 'new' }),
      requests.countDocuments({ status: 'in_progress' }),
    ]);

    if (!completed && apply) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          if (await markers.findOne({ _id: KEY }, { session })) return;

          // Use the old meanings before converting Draft to New.
          await requests.updateMany(
            { status: { $in: ['new', 'in_progress'] } },
            { $set: { status: 'on_moderation' }, $unset: { reviewState: '' } },
            { session }
          );

          await requests.updateMany(
            { status: 'draft' },
            { $set: { status: 'new' }, $unset: { reviewState: '' } },
            { session }
          );

          // Existing audit history remains historically accurate, but statuses
          // use the new vocabulary so they satisfy the shared response contract.
          await requests.updateMany(
            { history: { $exists: true, $ne: [] } },
            [
              {
                $set: {
                  history: {
                    $map: {
                      input: '$history',
                      as: 'event',
                      in: {
                        $mergeObjects: [
                          '$$event',
                          {
                            status: {
                              $switch: {
                                branches: [
                                  {
                                    case: { $eq: ['$$event.status', 'draft'] },
                                    then: 'new',
                                  },
                                  {
                                    case: {
                                      $in: [
                                        '$$event.status',
                                        ['new', 'in_progress'],
                                      ],
                                    },
                                    then: 'on_moderation',
                                  },
                                ],
                                default: '$$event.status',
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            ],
            { session }
          );

          await markers.insertOne(
            { _id: KEY, appliedAt: new Date(), draft, submitted, inProgress },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
    }

    if (apply && (completed || (await markers.findOne({ _id: KEY })))) {
      const indexes = await requests.indexes();
      const index = indexes.find((entry) => entry.name === INDEX_NAME);

      if (
        index &&
        JSON.stringify(index.partialFilterExpression) !==
          JSON.stringify(partialFilterExpression)
      ) {
        await requests.dropIndex(INDEX_NAME);
      }

      if (
        !index ||
        JSON.stringify(index.partialFilterExpression) !==
          JSON.stringify(partialFilterExpression)
      ) {
        await requests.createIndex(
          { article: 1 },
          { name: INDEX_NAME, unique: true, partialFilterExpression }
        );
      }
    }

    console.log(
      JSON.stringify({
        migration: KEY,
        mode: apply ? 'apply' : 'preview',
        alreadyApplied: Boolean(completed),
        legacy: { draft, submitted, inProgress },
        requiresMigration: !completed && draft + submitted + inProgress > 0,
      })
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      migration: KEY,
      status: 'failed',
      error: error instanceof Error ? error.message : 'unknown',
    })
  );

  process.exitCode = 1;
});
