import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { ProductRequest } from '../models/productRequest.model';

import { deleteProductRequestService } from './product-request.service';

//===================================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;

//===================================================================

function getTestMongoUri(): string {
  if (!TEST_MONGODB_URI) {
    throw new Error(
      'E_PHARMACY_TEST_MONGODB_URI is required for Mongo integration tests.'
    );
  }

  return TEST_MONGODB_URI;
}

//===================================================================

async function createDraftAggregate(
  input: Readonly<{
    pharmacyId: Types.ObjectId;
    ownerId: Types.ObjectId;
    article: string;
  }>
) {
  const request = await ProductRequest.create({
    pharmacyId: input.pharmacyId,
    name: `Delete atomicity ${input.article}`,
    article: input.article,
    category: 'medicine',
    status: 'draft',
  });

  const note = await PharmacyNote.create({
    pharmacyId: input.pharmacyId,
    entityType: 'product_request',
    entityId: request._id,
    text: 'Private request note.',
    createdBy: input.ownerId,
  });

  return {
    requestId: request._id as Types.ObjectId,
    noteId: note._id as Types.ObjectId,
  };
}

//===================================================================

test(
  'product request deletion rolls request and private notes back together',
  { skip: shouldSkip },
  async (context) => {
    await mongoose.connect(getTestMongoUri());

    const ownerId = new Types.ObjectId();
    const pharmacyId = new Types.ObjectId();
    const suffix = new Types.ObjectId().toHexString().toUpperCase();

    await Pharmacy.create({
      _id: pharmacyId,
      ownerId,
      managerUserIds: [],
      documents: [],
      name: `Delete Atomicity Pharmacy ${suffix.slice(-6)}`,
      status: 'active',
    });

    const requestIds: Types.ObjectId[] = [];
    const noteIds: Types.ObjectId[] = [];

    try {
      await context.test(
        'successful delete removes both aggregate parts',
        async () => {
          const aggregate = await createDraftAggregate({
            pharmacyId,
            ownerId,
            article: `DEL-OK-${suffix.slice(-8)}`,
          });

          requestIds.push(aggregate.requestId);
          noteIds.push(aggregate.noteId);

          await deleteProductRequestService(
            ownerId.toString(),
            aggregate.requestId.toString()
          );

          const [request, note] = await Promise.all([
            ProductRequest.findById(aggregate.requestId).lean(),
            PharmacyNote.findById(aggregate.noteId).lean(),
          ]);

          assert.equal(request, null);
          assert.equal(note, null);
        }
      );

      await context.test(
        'note cleanup failure rolls an already-issued request delete back',
        async () => {
          const aggregate = await createDraftAggregate({
            pharmacyId,
            ownerId,
            article: `DEL-NOTE-${suffix.slice(-8)}`,
          });

          requestIds.push(aggregate.requestId);
          noteIds.push(aggregate.noteId);

          const originalDeleteMany = PharmacyNote.deleteMany;

          try {
            PharmacyNote.deleteMany = (() =>
              ({
                session: async () => {
                  throw new Error('Injected note cleanup failure.');
                },
              }) as never) as typeof PharmacyNote.deleteMany;

            await assert.rejects(
              deleteProductRequestService(
                ownerId.toString(),
                aggregate.requestId.toString()
              ),
              /Injected note cleanup failure/
            );
          } finally {
            PharmacyNote.deleteMany = originalDeleteMany;
          }

          const [request, note] = await Promise.all([
            ProductRequest.findById(aggregate.requestId).lean(),
            PharmacyNote.findById(aggregate.noteId).lean(),
          ]);

          assert.ok(request);
          assert.ok(note);
        }
      );

      await context.test(
        'request delete failure leaves private notes untouched',
        async () => {
          const aggregate = await createDraftAggregate({
            pharmacyId,
            ownerId,
            article: `DEL-REQ-${suffix.slice(-8)}`,
          });

          requestIds.push(aggregate.requestId);
          noteIds.push(aggregate.noteId);

          const originalDeleteOne = ProductRequest.deleteOne;

          try {
            ProductRequest.deleteOne = (() =>
              ({
                session: async () => {
                  throw new Error('Injected request delete failure.');
                },
              }) as never) as typeof ProductRequest.deleteOne;

            await assert.rejects(
              deleteProductRequestService(
                ownerId.toString(),
                aggregate.requestId.toString()
              ),
              /Injected request delete failure/
            );
          } finally {
            ProductRequest.deleteOne = originalDeleteOne;
          }

          const [request, note] = await Promise.all([
            ProductRequest.findById(aggregate.requestId).lean(),
            PharmacyNote.findById(aggregate.noteId).lean(),
          ]);

          assert.ok(request);
          assert.ok(note);
        }
      );
    } finally {
      await Promise.all([
        ProductRequest.deleteMany({ _id: { $in: requestIds } }),
        PharmacyNote.deleteMany({ _id: { $in: noteIds } }),
        Pharmacy.deleteOne({ _id: pharmacyId }),
      ]);

      await mongoose.disconnect();
    }
  }
);
