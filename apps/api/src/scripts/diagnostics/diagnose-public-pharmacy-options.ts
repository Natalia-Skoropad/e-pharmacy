import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { performance } from 'node:perf_hooks';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PUBLIC_PHARMACY_STATUS_FILTER } from '../../services/pharmacies/pharmacy-public-status';
import { PUBLIC_PHARMACY_IMAGE_PROJECTION } from '../../services/pharmacies/pharmacy-public-image';

//===================================================================

// Read-only profiling of the public autocomplete. No names, email addresses,
// phone numbers, image contents, document metadata or database URLs are logged.
// pnpm --filter @e-pharmacy/api diagnose:public-pharmacy-options <pharmacyId>
const PAGE_SIZE = 50;
const INDEX_NAME = 'public_pharmacy_name_order';

//===================================================================

const round = (value: number) => Math.round(value);

//===================================================================

async function measure<T>(read: () => Promise<T>) {
  const started = performance.now();
  const value = await read();

  return { value, elapsedMs: round(performance.now() - started) };
}

//===================================================================

async function main() {
  const [pharmacyId, ...extras] = process.argv.slice(2);

  if (!pharmacyId || !Types.ObjectId.isValid(pharmacyId) || extras.length) {
    throw new Error(
      'Usage: pnpm diagnose:public-pharmacy-options <24-char-pharmacy-id>'
    );
  }

  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    const id = new Types.ObjectId(pharmacyId);
    const filter = { status: PUBLIC_PHARMACY_STATUS_FILTER };

    const indexNames = (await Pharmacy.collection.indexes()).map(
      (index) => index.name
    );

    const sortPage = (page: number) =>
      Pharmacy.find(filter)
        .select('_id')
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE);

    const [firstPage, secondPage, selectedWithoutImage, selectedWithImage] =
      await Promise.all([
        measure(async () => (await sortPage(1).lean()).map((item) => item._id)),
        measure(async () => (await sortPage(2).lean()).map((item) => item._id)),
        measure(() => Pharmacy.findById(id).select('_id name').lean()),
        measure(() => Pharmacy.findById(id).select('_id imageUrl').lean()),
      ]);

    const hydrated = await measure(() =>
      Pharmacy.aggregate<{ _id: Types.ObjectId; imageUrl?: string }>([
        {
          $match: {
            _id: { $in: secondPage.value },
            status: PUBLIC_PHARMACY_STATUS_FILTER,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            location: 1,
            imageUrl: PUBLIC_PHARMACY_IMAGE_PROJECTION,
          },
        },
      ])
    );

    const explain = (await sortPage(2).explain(
      'executionStats'
    )) as unknown as {
      executionStats?: {
        totalKeysExamined?: number;
        totalDocsExamined?: number;
        executionTimeMillis?: number;
      };
    };

    console.log(
      JSON.stringify(
        {
          mode: 'read-only',
          indexInstalled: indexNames.includes(INDEX_NAME),

          firstPage: {
            count: firstPage.value.length,
            idsReadMs: firstPage.elapsedMs,
          },

          secondPage: {
            count: secondPage.value.length,
            idsReadMs: secondPage.elapsedMs,
            detailsReadMs: hydrated.elapsedMs,

            imageChars: hydrated.value.reduce(
              (sum, item) => sum + (item.imageUrl?.length ?? 0),
              0
            ),

            lazyPhotoUrls: hydrated.value.filter((item) =>
              item.imageUrl?.endsWith('/photo')
            ).length,
          },

          selected: {
            found: Boolean(selectedWithoutImage.value),
            nameOnlyReadMs: selectedWithoutImage.elapsedMs,
            withImageReadMs: selectedWithImage.elapsedMs,
            imageChars: selectedWithImage.value?.imageUrl?.length ?? 0,
            imageIsDataUrl: Boolean(
              selectedWithImage.value?.imageUrl?.startsWith('data:image/')
            ),
          },

          queryPlan: {
            keysExamined: explain.executionStats?.totalKeysExamined ?? null,

            documentsExamined:
              explain.executionStats?.totalDocsExamined ?? null,

            executionTimeMs:
              explain.executionStats?.executionTimeMillis ?? null,
          },
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

main().catch((error: unknown) => {
  const failure = error as { name?: string; code?: string | number };
  const message = error instanceof Error ? error.message : String(error);

  const safeMessage = message
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '[MongoDB URI redacted]')
    .replace(
      /(password|pwd|secret|token)\s*[:=]\s*[^\s,}]+/gi,
      '$1=[redacted]'
    );

  console.error(
    JSON.stringify({
      diagnostic: 'failed',
      type: failure.name ?? 'Error',
      code: failure.code ?? null,
      message: safeMessage,
    })
  );

  process.exitCode = 1;
});
