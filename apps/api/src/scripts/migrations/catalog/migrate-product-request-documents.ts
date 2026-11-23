import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

import { ProductRequest } from '../../../models/catalog/productRequest.model';
import { ProductRequestDocumentFile } from '../../../models/catalog/productRequestDocumentFile.model';
import { Pharmacy } from '../../../models/pharmacies/pharmacy.model';

import { resolveProductRequestDocuments } from '../../../services/catalog/product-request-document.service';

import type { ProductRequestFile } from '../../../types/catalog/product-request';

//===================================================================

/** Safe preview by default. --apply requires a database backup first. */
async function main(): Promise<void> {
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

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  const stats = { inspected: 0, eligible: 0, updated: 0, files: 0, skipped: 0 };

  try {
    if (apply) await ProductRequestDocumentFile.createIndexes();

    const requests = ProductRequest.find({
      'additionalFiles.dataUrl': { $exists: true },
    })
      .select('_id ownerId pharmacyId additionalFiles')
      .cursor();

    for await (const candidate of requests) {
      stats.inspected++;

      const legacyFiles: ProductRequestFile[] = candidate.additionalFiles ?? [];

      if (!legacyFiles.some((file) => Boolean(file.dataUrl))) continue;

      const owner =
        candidate.ownerId ??
        (candidate.pharmacyId
          ? (
              await Pharmacy.findById(candidate.pharmacyId)
                .select('ownerId')
                .lean<{ ownerId?: Types.ObjectId } | null>()
            )?.ownerId
          : undefined);

      if (!owner) {
        stats.skipped++;
        continue;
      }

      stats.eligible++;

      if (!apply) {
        stats.files += legacyFiles.filter((file) =>
          Boolean(file.dataUrl)
        ).length;

        continue;
      }

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const current = await ProductRequest.findOne({
            _id: candidate._id,
            'additionalFiles.dataUrl': { $exists: true },
          }).session(session);

          if (!current) return;

          const files = current.additionalFiles as ProductRequestFile[];

          const stored = await resolveProductRequestDocuments(
            new Types.ObjectId(String(owner)),
            current._id,
            files,
            session
          );

          current.additionalFiles = stored;

          await current.save({ session });

          stats.files += files.filter((file) => Boolean(file.dataUrl)).length;
          stats.updated++;
        });
      } catch {
        // Preserve old embedded payload if validation/storage fails.
        stats.skipped++;
      } finally {
        await session.endSession();
      }
    }

    console.log(
      JSON.stringify({
        migration: 'product-request-documents',
        mode: apply ? 'apply' : 'preview',
        ...stats,
      })
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

main().catch((error: unknown) => {
  const failure = error as { name?: string; code?: string | number };

  console.error(
    JSON.stringify({
      migration: 'product-request-documents',
      status: 'failed',
      type: failure.name ?? 'Error',
      code: failure.code ?? null,
    })
  );

  process.exitCode = 1;
});
