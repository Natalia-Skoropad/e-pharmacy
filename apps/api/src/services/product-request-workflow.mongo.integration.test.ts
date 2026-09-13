import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductRequest } from '../models/productRequest.model';
import type { HttpError } from '../types/errors';

import {
  createProductRequestService,
  moderateProductRequestByAdminService,
} from './product-request.service';

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

function getRejectedHttpError(
  result: PromiseSettledResult<unknown>
): HttpError | null {
  return result.status === 'rejected' ? (result.reason as HttpError) : null;
}

//===================================================================

test(
  'product request uniqueness and moderation remain backend-authoritative under concurrency',
  { skip: shouldSkip },
  async (context) => {
    await mongoose.connect(getTestMongoUri());
    await Promise.all([Product.init(), ProductRequest.init()]);

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const adminUserId = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyA,
        ownerId: ownerA,
        managerUserIds: [],
        documents: [],
        name: `Workflow Pharmacy A ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyB,
        ownerId: ownerB,
        managerUserIds: [],
        documents: [],
        name: `Workflow Pharmacy B ${suffix.slice(-6)}`,
        status: 'active',
      }),
    ]);

    const requestIds: Types.ObjectId[] = [];
    const productIds: Types.ObjectId[] = [];

    try {
      await context.test(
        'parallel creates keep one active request per article',
        async () => {
          const article = `REQ-RACE-${suffix.slice(-10)}`;
          const input = {
            status: 'draft' as const,
            name: 'Concurrent request product',
            article,
            category: 'medicine' as const,
          };

          const results = await Promise.allSettled([
            createProductRequestService(ownerA.toString(), input),
            createProductRequestService(ownerB.toString(), input),
          ]);

          assert.equal(
            results.filter((result) => result.status === 'fulfilled').length,
            1
          );

          assert.equal(
            results.filter((result) => result.status === 'rejected').length,
            1
          );

          const rejected = results.find(
            (result) => result.status === 'rejected'
          );

          const error = rejected ? getRejectedHttpError(rejected) : null;
          assert.ok(error);
          assert.equal(error.status, 409);
          assert.equal(error.code, 'PRODUCT_REQUEST_ARTICLE_CONFLICT');

          const created = await ProductRequest.find({ article })
            .select('_id')
            .lean<Array<{ _id: Types.ObjectId }>>();

          assert.equal(created.length, 1);
          requestIds.push(...created.map((request) => request._id));
        }
      );

      await context.test(
        'invalid transitions are rejected by the service',
        async () => {
          const request = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Invalid transition product',
            article: `REQ-INVALID-${suffix.slice(-10)}`,
            category: 'medicine',
            status: 'draft',
          });

          requestIds.push(request._id as Types.ObjectId);

          await assert.rejects(
            moderateProductRequestByAdminService(
              String(request._id),
              { status: 'in_progress' },
              adminUserId.toString()
            ),
            (error: unknown) => {
              const httpError = error as HttpError;
              return (
                httpError.status === 409 &&
                httpError.code === 'PRODUCT_REQUEST_INVALID_TRANSITION'
              );
            }
          );
        }
      );

      await context.test(
        'approval creates and links a canonical catalog product',
        async () => {
          const article = `REQ-APPROVE-${suffix.slice(-10)}`;

          const request = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Approved request product',
            article,
            category: 'medicine',
            status: 'in_progress',
            fullDescription: 'Approved product description.',
            manufacturer: 'Workflow Manufacturer',
            dosage: '10 mg',
            packageSize: '20 tablets',
          });

          requestIds.push(request._id as Types.ObjectId);

          const result = await moderateProductRequestByAdminService(
            String(request._id),
            { status: 'approved' },
            adminUserId.toString()
          );

          assert.equal(result.request.status, 'approved');
          assert.ok(result.request.productId);

          const product = await Product.findById(result.request.productId)
            .select('_id article')
            .lean<{ _id: Types.ObjectId; article: string } | null>();

          assert.ok(product);
          assert.equal(product.article, article);
          productIds.push(product._id);

          const persistedRequest = await ProductRequest.findById(request._id)
            .select('status productId')
            .lean<{
              status: string;
              productId?: Types.ObjectId;
            } | null>();

          assert.equal(persistedRequest?.status, 'approved');

          assert.equal(
            String(persistedRequest?.productId),
            String(product._id)
          );
        }
      );

      await context.test(
        'approval rejects an explicitly mismatched catalog product',
        async () => {
          const request = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Mismatched approval request',
            article: `REQ-MISMATCH-${suffix.slice(-10)}`,
            category: 'medicine',
            status: 'in_progress',
          });

          requestIds.push(request._id as Types.ObjectId);

          const otherProduct = await Product.create({
            name: 'Different catalog product',
            article: `PRODUCT-OTHER-${suffix.slice(-10)}`,
            category: 'medicine',
            status: 'active',
            inStock: false,
          });

          productIds.push(otherProduct._id as Types.ObjectId);

          await assert.rejects(
            moderateProductRequestByAdminService(
              String(request._id),
              { status: 'approved', productId: String(otherProduct._id) },
              adminUserId.toString()
            ),
            (error: unknown) => {
              const httpError = error as HttpError;
              return (
                httpError.status === 409 &&
                httpError.code === 'PRODUCT_REQUEST_APPROVAL_PRODUCT_CONFLICT'
              );
            }
          );

          const persistedRequest = await ProductRequest.findById(request._id)
            .select('status productId')
            .lean<{ status: string; productId?: Types.ObjectId } | null>();

          assert.equal(persistedRequest?.status, 'in_progress');
          assert.equal(persistedRequest?.productId, undefined);
        }
      );

      await context.test(
        'concurrent moderation cannot commit two terminal outcomes',
        async () => {
          const article = `REQ-MODERATE-${suffix.slice(-10)}`;

          const request = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Concurrent moderation request',
            article,
            category: 'medicine',
            status: 'in_progress',
          });

          requestIds.push(request._id as Types.ObjectId);

          const results = await Promise.allSettled([
            moderateProductRequestByAdminService(
              String(request._id),
              { status: 'approved' },
              adminUserId.toString()
            ),

            moderateProductRequestByAdminService(
              String(request._id),
              { status: 'rejected', reason: 'Concurrent rejection.' },
              adminUserId.toString()
            ),
          ]);

          assert.equal(
            results.filter((result) => result.status === 'fulfilled').length,
            1
          );

          assert.equal(
            results.filter((result) => result.status === 'rejected').length,
            1
          );

          const persistedRequest = await ProductRequest.findById(request._id)
            .select('status productId')
            .lean<{ status: string; productId?: Types.ObjectId } | null>();

          assert.ok(persistedRequest);

          assert.ok(
            persistedRequest.status === 'approved' ||
              persistedRequest.status === 'rejected'
          );

          if (persistedRequest.productId) {
            productIds.push(persistedRequest.productId);
          }
        }
      );
    } finally {
      await Promise.all([
        ProductRequest.deleteMany({ _id: { $in: requestIds } }),
        Product.deleteMany({ _id: { $in: productIds } }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
      ]);
      await mongoose.disconnect();
    }
  }
);
