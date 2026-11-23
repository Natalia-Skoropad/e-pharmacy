import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

import { Product } from '../../../models/catalog/product.model';
import { ProductRequest } from '../../../models/catalog/productRequest.model';

import {
  getDemoProductCharacteristics,
  getDemoProductExpectedName,
  getDemoRequestCharacteristics,
  PRODUCT_REQUEST_SEED_NAMES,
  type DemoCharacteristics,
} from '../../seeds/catalog-demo-characteristics';

//===================================================================

// Preview is the default. --apply updates only verifiable demo documents,
// and only missing values. This script never reseeds or deletes collections.
const apply = process.argv.includes('--apply');
const missing = (value: unknown) => value == null || value === '';
const legacyNumber = (value: unknown) => typeof value === 'number';

//===============================================================

type Document = Record<string, unknown> & { _id: Types.ObjectId };

type Stats = {
  inspected: number;
  eligible: number;
  fields: number;
  updated: number;
  skipped: number;
};

//===============================================================

const stats = (): Stats => ({
  inspected: 0,
  eligible: 0,
  fields: 0,
  updated: 0,
  skipped: 0,
});

//===============================================================

// Only copy declared demo data into missing fields; preserve every manually
// adjusted value, including requests in other owners' accounts.
function missingAttributes(
  existing: Document,
  fixture: DemoCharacteristics
): Record<string, string> {
  const changes: Record<string, string> = {};

  for (const [field, expected] of Object.entries(fixture)) {
    if (!expected) continue;
    if (missing(existing[field])) changes[field] = expected;
    else if (
      field === 'activeIngredientCount' &&
      legacyNumber(existing[field])
    ) {
      // Seed-era count (1) was numeric; convert only a verified demo record.
      changes[field] = `${existing[field]} ingredient(s)`;
    }
  }

  return changes;
}

//===============================================================

async function updateIfMissing(
  collection: typeof Product.collection,
  entry: Document,
  fields: Record<string, string>,
  result: Stats
): Promise<void> {
  const pairs = Object.entries(fields);

  if (!pairs.length) return;

  result.eligible += 1;
  result.fields += pairs.length;

  if (!apply) return;

  // A concurrent manual edit wins: optimistic predicates on each field.
  const conditions = pairs.map(([field]) => ({
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: '' },

      ...(legacyNumber(entry[field]) ? [{ [field]: entry[field] }] : []),
    ],
  }));

  const operation = await collection.updateOne(
    { _id: entry._id, $and: conditions },
    { $set: fields }
  );

  result.updated += operation.modifiedCount;

  if (!operation.modifiedCount) result.skipped += 1;
}

//===============================================================

async function migrate(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    apply &&
    !process.argv.includes('--production-approved')
  ) {
    throw new Error(
      'Production requires --production-approved and a verified backup'
    );
  }

  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10000,
  });

  const products = stats();
  const requests = stats();

  try {
    const cursor = Product.collection.find(
      { article: /^EPH-\d{4}$/ },
      {
        projection: {
          _id: 1,
          article: 1,
          name: 1,
          manufacturer: 1,
          brand: 1,
          series: 1,
          releaseForm: 1,
          activeIngredients: 1,
          activeIngredientCount: 1,
        },
      }
    );

    for await (const item of cursor) {
      products.inspected += 1;

      const doc = item as unknown as Document;
      const index = Number(String(doc.article).slice(4)) - 1;
      const expectedName = getDemoProductExpectedName(index);
      const fixture = getDemoProductCharacteristics(index);

      if (
        !expectedName ||
        doc.name !== expectedName ||
        !fixture ||
        doc.manufacturer !== fixture.manufacturer
      ) {
        products.skipped += 1;
        continue;
      }

      await updateIfMissing(
        Product.collection,
        doc,
        missingAttributes(doc, fixture),
        products
      );
    }

    const seedDate = Date.UTC(2026, 5, 25, 8, 30);

    const requestCursor = ProductRequest.collection.find(
      {
        status: { $in: ['approved', 'in_progress'] },
        'productImage.name': /^product-image-\d+\.jpg$/,
      },
      {
        projection: {
          _id: 1,
          name: 1,
          status: 1,
          article: 1,
          productImage: 1,
          createdAt: 1,
          manufacturer: 1,
          brand: 1,
          series: 1,
          releaseForm: 1,
          activeIngredients: 1,
          activeIngredientCount: 1,
        },
      }
    );

    for await (const item of requestCursor) {
      requests.inspected += 1;

      const doc = item as unknown as Document;

      const imageName =
        (doc.productImage as { name?: string } | undefined)?.name ?? '';

      const index =
        Number(imageName.match(/^product-image-(\d+)\.jpg$/)?.[1]) - 1;

      if (
        !(index >= 0 && index < PRODUCT_REQUEST_SEED_NAMES.length) ||
        !(doc.createdAt instanceof Date) ||
        doc.createdAt.getTime() !== seedDate + index * 86400000 ||
        !String(doc.article).match(/^(?:REQ|EPH)-\d{4}$/)
      ) {
        requests.skipped += 1;
        continue;
      }

      const productIndex = /^EPH-\d{4}$/.test(String(doc.article))
        ? Number(String(doc.article).slice(4)) - 1
        : null;

      const productFixture =
        productIndex === null
          ? null
          : getDemoProductCharacteristics(productIndex);

      const expectedName =
        productIndex === null
          ? PRODUCT_REQUEST_SEED_NAMES[index].replace(/№\s*/g, 'No. ').trim()
          : getDemoProductExpectedName(productIndex);

      const expectedManufacturer =
        productIndex === null
          ? ['Medica Nova', 'HealthLab', 'CareLine', 'VitaWorks'][index % 4]
          : productFixture?.manufacturer;

      if (
        !expectedName ||
        !expectedManufacturer ||
        doc.name !== expectedName ||
        doc.manufacturer !== expectedManufacturer
      ) {
        requests.skipped += 1;
        continue;
      }

      const fixture =
        productFixture ??
        getDemoRequestCharacteristics(index, expectedManufacturer);

      if (!fixture || !fixture.manufacturer) {
        requests.skipped += 1;
        continue;
      }

      await updateIfMissing(
        ProductRequest.collection as unknown as typeof Product.collection,
        doc,
        missingAttributes(doc, fixture),
        requests
      );
    }

    console.log(
      JSON.stringify({
        migration: 'demo-product-characteristics',
        mode: apply ? 'apply' : 'preview',
        products,
        requests,
      })
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===============================================================

migrate().catch((error: unknown) => {
  const failure = error as { name?: string; code?: string | number };

  console.error(
    JSON.stringify({
      migration: 'demo-product-characteristics',
      status: 'failed',
      type: failure.name ?? 'Error',
      code: failure.code ?? null,
    })
  );

  process.exitCode = 1;
});
