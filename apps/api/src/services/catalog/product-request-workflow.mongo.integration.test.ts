import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';

import mongoose, { Types } from 'mongoose';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';
import { getTestProductCategoryId } from './__tests__/product-category-test.helper';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { PharmacyNote } from '../../models/pharmacies/pharmacyNote.model';
import { User } from '../../models/accounts/user.model';
import { Product } from '../../models/catalog/product.model';
import { ProductCategory } from '../../models/catalog/productCategory.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';
import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';

import { ProductRequestAdminComment } from '../../models/admin/comments/productRequestAdminComment.model';

import {
  createProductRequestAdminCommentService,
  listProductRequestAdminCommentsService,
  deleteProductRequestAdminCommentService,
} from '../admin/catalog/product-request-admin-comment.service';

import {
  listAdminAuditLogsService,
  getAdminAuditLogService,
} from '../admin/audit/admin-audit-read.service';

import type { HttpError } from '../../types/http/errors';

import {
  createProductRequestService,
  updateProductRequestService,
  submitProductRequestService,
  cancelProductRequestService,
} from './product-request-management.service';

import {
  getProductRequestArticleAvailabilityService,
  getAdminProductRequestsService,
  getAdminProductRequestByIdService,
  getProductRequestByIdService,
  getProductRequestsService,
  getAdminProductRequestOwnerOptionsService,
  getAdminProductRequestStatisticsService,
} from './product-request-read.service';

import { moderateProductRequestByAdminService } from './product-request-moderation.service';

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

    const medicineCategoryId = await getTestProductCategoryId();

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const adminUserId = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();

    await seedIntegrationPharmacyActors([ownerA, ownerB]);

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
        'admin registry scopes and paginates requests and deduplicates legacy owners',
        async () => {
          const name = `Registry ${suffix}`;

          const [direct, legacy, other] = await ProductRequest.create([
            {
              ownerId: ownerA,
              name: `${name} direct`,
              status: 'new',
              categoryMode: 'catalog',
              categoryId: medicineCategoryId,
            },
            {
              pharmacyId: pharmacyA,
              name: `${name} legacy`,
              status: 'new',
              categoryMode: 'catalog',
            },
            {
              ownerId: ownerB,
              name: `${name} other`,
              status: 'new',
              categoryMode: 'catalog',
            },
          ]);

          requestIds.push(direct._id, legacy._id, other._id);

          const scope = {
            page: 1,
            perPage: 20 as const,
            ownerId: ownerA.toString(),
            keyword: name,
          };

          const list = await getAdminProductRequestsService(scope);

          assert.equal(list.total, 2);

          assert.deepEqual(
            new Set(list.items.map((item) => item.id)),
            new Set([String(direct._id), String(legacy._id)])
          );

          assert.ok(
            list.items.every((item) => item.owner?.id === ownerA.toString())
          );

          const clamped = await getAdminProductRequestsService({
            ...scope,
            page: 999,
          });

          assert.equal(clamped.page, 1);
          assert.equal(clamped.totalPages, 1);

          const mismatch = await getAdminProductRequestsService({
            ...scope,
            requestId: other._id.toString(),
          });

          assert.equal(mismatch.total, 0);

          const noCategory = await getAdminProductRequestsService({
            ...scope,
            category: `missing-${suffix.toLowerCase()}`,
          });

          assert.equal(noCategory.total, 0);

          const wrongStatus = await getAdminProductRequestsService({
            ...scope,
            status: 'approved',
          });

          assert.equal(wrongStatus.total, 0);

          const options = await getAdminProductRequestOwnerOptionsService({
            page: 1,
            perPage: 20,
            requestId: legacy._id.toString(),
          });

          assert.deepEqual(
            options.items.map((item) => item.id),
            [ownerA.toString()]
          );

          const secondPage = await getAdminProductRequestOwnerOptionsService({
            page: 2,
            perPage: 20,
            requestId: legacy._id.toString(),
          });

          assert.equal(secondPage.items.length, 0);

          const stats = await getAdminProductRequestStatisticsService();

          assert.ok(stats.new >= 3);

          const ownerStats = await getAdminProductRequestStatisticsService(
            ownerA.toString()
          );

          const otherStats = await getAdminProductRequestStatisticsService(
            ownerB.toString()
          );

          assert.equal(ownerStats.new, 2);
          assert.equal(otherStats.new, 1);

          await ProductRequest.deleteMany({
            _id: { $in: [direct._id, legacy._id, other._id] },
          });
        }
      );

      await context.test(
        'multiple name-only drafts remain valid for one owner',
        async () => {
          const first = await createProductRequestService(ownerA.toString(), {
            status: 'new',
            name: 'Name only draft alpha',
            article: '',
            categoryMode: 'catalog',
          });

          requestIds.push(new Types.ObjectId(first.request.id));

          const second = await createProductRequestService(ownerA.toString(), {
            status: 'new',
            name: 'Name only draft beta',
            article: '',
            categoryMode: 'catalog',
          });

          requestIds.push(new Types.ObjectId(second.request.id));
          assert.equal(first.request.article, '');
          assert.equal(second.request.article, '');
          assert.notEqual(first.request.id, second.request.id);

          const actor = await User.findById(ownerA).select('name').lean();

          assert.ok(actor?.name);

          assert.equal(
            (await getAdminProductRequestByIdService(first.request.id)).request
              .history?.[0]?.actorName,
            actor.name
          );

          assert.equal(first.request.history?.[0]?.actorName, actor.name);

          assert.equal(
            (
              await getProductRequestByIdService(
                ownerA.toString(),
                first.request.id
              )
            ).request.history?.[0]?.actorName,
            actor.name
          );

          // Simulate a request from before actor snapshots were stored in history.
          await ProductRequest.updateOne(
            { _id: first.request.id },
            { $unset: { 'history.0.actorNameSnapshot': 1 } }
          );

          assert.equal(
            (await getAdminProductRequestByIdService(first.request.id)).request
              .history?.[0]?.actorName,
            actor.name
          );

          assert.equal(
            (
              await getProductRequestByIdService(
                ownerA.toString(),
                first.request.id
              )
            ).request.history?.[0]?.actorName,
            actor.name
          );

          // A direct owner-scoped draft from before detailed auditing can
          // display the current owner's name, explicitly labelled as current.
          await ProductRequest.updateOne(
            { _id: second.request.id },
            { $unset: { 'history.0.actorNameSnapshot': 1 } }
          );

          await AdminAuditLog.deleteMany({
            entityType: 'productRequest',
            entityId: second.request.id,
            action: 'productRequest.created',
          });

          const older = await getAdminProductRequestByIdService(
            second.request.id
          );

          assert.equal(older.request.history?.[0]?.actorName, actor.name);

          assert.equal(
            older.request.history?.[0]?.actorNameSource,
            'current_owner'
          );

          const ownerDetails = await getProductRequestByIdService(
            ownerA.toString(),
            second.request.id
          );

          assert.equal(
            ownerDetails.request.history?.[0]?.actorName,
            actor.name
          );

          assert.equal(
            ownerDetails.request.history?.[0]?.actorNameSource,
            'current_owner'
          );
        }
      );

      await context.test(
        'Admin private request comments and field audit never cross request scopes',
        async () => {
          await User.create({
            _id: adminUserId,
            name: 'Workflow Audit Admin',
            email: `request-audit-${suffix.toLowerCase()}@example.com`,
            phone: `+380${(BigInt(`0x${adminUserId.toHexString().slice(-12)}`) % 1000000000n).toString().padStart(9, '0')}`,
            password: 'test-password-hash',
            role: 'admin',
            status: 'active',
          });

          const input = {
            status: 'new' as const,
            name: 'Audit original name',
            article: '',
            categoryMode: 'catalog' as const,
            categoryId: medicineCategoryId.toString(),
          };

          const first = await createProductRequestService(
            ownerA.toString(),
            input,
            randomUUID()
          );

          const second = await createProductRequestService(
            ownerB.toString(),
            input,
            randomUUID()
          );

          const id = first.request.id;

          requestIds.push(
            new Types.ObjectId(id),
            new Types.ObjectId(second.request.id)
          );

          await updateProductRequestService(
            ownerA.toString(),
            id,
            { ...input, name: 'Audit edited name' },
            randomUUID()
          );

          const comment = await createProductRequestAdminCommentService(
            id,
            adminUserId.toString(),
            { text: 'Admin only note', clientRequestId: randomUUID() },
            randomUUID()
          );

          assert.equal(
            (await listProductRequestAdminCommentsService(id))[0]?.text,
            'Admin only note'
          );

          assert.deepEqual(
            await listProductRequestAdminCommentsService(second.request.id),
            []
          );

          const activity = await listAdminAuditLogsService(
            { page: 1, perPage: 20 },
            { productRequestId: id }
          );

          assert.equal(activity.total, 3);

          const creation = activity.items.find(
            (item) => item.action === 'productRequest.created'
          );

          assert.ok(creation);

          const creationDetails = await getAdminAuditLogService(creation.id, {
            productRequestId: id,
          });

          const category = await ProductCategory.findById(medicineCategoryId)
            .select('name icon')
            .lean();

          assert.ok(category);
          assert.equal(creationDetails.after.categoryName, category.name);
          assert.equal(creationDetails.after.categoryIcon, category.icon);

          assert.equal(
            creationDetails.after.categoryId,
            medicineCategoryId.toString()
          );

          const edit = activity.items.find(
            (item) => item.action === 'productRequest.updated'
          );

          assert.ok(edit);

          const detail = await getAdminAuditLogService(edit.id, {
            productRequestId: id,
          });

          assert.equal(detail.before.name, 'Audit original name');
          assert.equal(detail.after.name, 'Audit edited name');

          await assert.rejects(() =>
            getAdminAuditLogService(edit.id, {
              productRequestId: second.request.id,
            })
          );

          await assert.rejects(() =>
            deleteProductRequestAdminCommentService(
              second.request.id,
              comment.id,
              adminUserId.toString(),
              randomUUID()
            )
          );

          await deleteProductRequestAdminCommentService(
            id,
            comment.id,
            adminUserId.toString(),
            randomUUID()
          );

          assert.deepEqual(
            await listProductRequestAdminCommentsService(id),
            []
          );

          const after = await listAdminAuditLogsService(
            { page: 1, perPage: 20 },
            { productRequestId: id }
          );

          assert.equal(after.total, 4);
        }
      );

      await context.test(
        'owner submission and cancellation return the complete authorized detail contract',
        async () => {
          const request = await ProductRequest.create({
            ownerId: ownerA,
            name: 'Complete moderation request',
            article: `REQ-SUBMIT-${suffix.slice(-10)}`,
            status: 'new',
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            brand: 'Workflow Brand',
            series: 'Workflow Series',
            manufacturer: 'Workflow Manufacturer',

            fullDescription:
              'Complete product description for moderation. '.repeat(4),

            productImage: {
              name: 'image.png',
              type: 'image/png',
              size: 1,
              dataUrl: 'data:image/png;base64,AA==',
            },

            additionalFiles: [
              {
                name: 'certificate.pdf',
                type: 'application/pdf',
                size: 1,
                dataUrl: 'data:application/pdf;base64,AA==',
              },
            ],

            history: [
              {
                status: 'new',
                title: 'Request created',
                description: 'The pharmacy owner saved a new request.',
                createdAt: new Date(),
              },
            ],
          });

          requestIds.push(request._id as Types.ObjectId);

          const id = String(request._id);

          await PharmacyNote.create({
            ownerId: ownerA,
            entityType: 'product_request',
            entityId: request._id,
            text: 'Private owner note',
            createdBy: ownerA,
          });

          const submitted = await submitProductRequestService(
            ownerA.toString(),
            id,
            randomUUID()
          );

          assert.equal(submitted.request.status, 'on_moderation');

          assert.equal(
            submitted.request.category?.id,
            String(medicineCategoryId)
          );

          assert.ok(submitted.request.category?.name);
          assert.equal(submitted.request.commentsTotal, 1);

          assert.equal(
            submitted.request.history?.at(-1)?.title,
            'Sent for moderation'
          );

          assert.ok(submitted.request.history?.at(-1)?.actorName);

          assert.deepEqual(
            submitted,
            await getProductRequestByIdService(ownerA.toString(), id)
          );

          await moderateProductRequestByAdminService(
            id,
            {
              status: 'on_moderation',
              reviewState: 'changes_requested',
              reason: 'Provide additional information',
            },
            adminUserId.toString(),
            randomUUID()
          );

          const ownerListQuery = {
            page: 1,
            perPage: 20 as const,
            requestId: id,
          };

          const correctionsList = await getProductRequestsService(
            ownerA.toString(),
            ownerListQuery
          );

          const correctionsDetail = await getProductRequestByIdService(
            ownerA.toString(),
            id
          );

          assert.equal(correctionsList.items.length, 1);
          assert.equal(correctionsList.items[0]?.status, 'on_moderation');

          assert.equal(
            correctionsList.items[0]?.reviewState,
            'changes_requested'
          );

          assert.equal(
            correctionsList.items[0]?.reviewState,
            correctionsDetail.request.reviewState
          );

          const resent = await submitProductRequestService(
            ownerA.toString(),
            id,
            randomUUID()
          );

          assert.equal(resent.request.category?.id, String(medicineCategoryId));
          assert.equal(resent.request.reviewState, undefined);

          const resentList = await getProductRequestsService(
            ownerA.toString(),
            ownerListQuery
          );

          assert.equal(resentList.items[0]?.status, 'on_moderation');
          assert.equal(resentList.items[0]?.reviewState, undefined);

          await moderateProductRequestByAdminService(
            id,
            {
              status: 'on_moderation',
              reviewState: 'changes_requested',
              reason: 'Provide additional documents',
            },
            adminUserId.toString(),
            randomUUID()
          );

          const cancellationAuditId = randomUUID();

          const cancelled = await cancelProductRequestService(
            ownerA.toString(),
            id,
            'Required supporting documents are unavailable',
            cancellationAuditId
          );

          assert.equal(cancelled.request.status, 'rejected');
          assert.equal(cancelled.request.cancelledBy, 'owner');

          assert.equal(
            cancelled.request.rejectionReason,
            'Required supporting documents are unavailable'
          );

          assert.equal(
            cancelled.request.history?.at(-1)?.description,
            'Required supporting documents are unavailable'
          );

          assert.equal(
            cancelled.request.category?.id,
            String(medicineCategoryId)
          );

          assert.equal(cancelled.request.commentsTotal, 1);

          assert.deepEqual(
            cancelled,
            await getProductRequestByIdService(ownerA.toString(), id)
          );

          const audit = await AdminAuditLog.findOne({
            requestId: cancellationAuditId,
            entityId: id,
          }).lean();

          assert.equal(
            audit?.reason,
            'Required supporting documents are unavailable'
          );
        }
      );

      await context.test(
        'parallel creates keep one active request per article',
        async () => {
          const article = `REQ-RACE-${suffix.slice(-10)}`;

          const input = {
            status: 'new' as const,
            name: 'Concurrent request product',
            article,
            categoryMode: 'catalog' as const,
            categoryId: medicineCategoryId.toString(),
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
        'article availability excludes only requests owned by the current pharmacy',
        async () => {
          const ownArticle = `REQ-OWN-${suffix.slice(-10)}`;

          const ownRequest = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Own availability request',
            article: ownArticle,
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'new',
          });

          const foreignRequest = await ProductRequest.create({
            pharmacyId: pharmacyB,
            name: 'Foreign availability request',
            article: `REQ-FOREIGN-${suffix.slice(-10)}`,
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'new',
          });

          requestIds.push(
            ownRequest._id as Types.ObjectId,
            foreignRequest._id as Types.ObjectId
          );

          const ownResult = await getProductRequestArticleAvailabilityService(
            ownerA.toString(),

            {
              article: ownArticle,
              excludeRequestId: String(ownRequest._id),
            }
          );

          assert.equal(ownResult.available, true);

          await assert.rejects(
            getProductRequestArticleAvailabilityService(ownerA.toString(), {
              article: foreignRequest.article,
              excludeRequestId: String(foreignRequest._id),
            }),

            (error: unknown) => {
              const httpError = error as HttpError;

              return (
                httpError.status === 404 &&
                httpError.code === 'PRODUCT_REQUEST_NOT_FOUND'
              );
            }
          );

          await assert.rejects(
            getProductRequestArticleAvailabilityService(ownerA.toString(), {
              article: ownArticle,
              excludeRequestId: new Types.ObjectId().toString(),
            }),

            (error: unknown) => {
              const httpError = error as HttpError;

              return (
                httpError.status === 404 &&
                httpError.code === 'PRODUCT_REQUEST_NOT_FOUND'
              );
            }
          );
        }
      );

      await context.test(
        'create and update keep authoritative article conflict checks',
        async () => {
          const occupiedArticle = `REQ-OCCUPIED-${suffix.slice(-10)}`;
          const editableArticle = `REQ-EDITABLE-${suffix.slice(-10)}`;

          const occupiedRequest = await ProductRequest.create({
            pharmacyId: pharmacyB,
            name: 'Occupied request',
            article: occupiedArticle,
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'new',
          });

          const editableRequest = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Editable request',
            article: editableArticle,
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'new',
          });

          requestIds.push(
            occupiedRequest._id as Types.ObjectId,
            editableRequest._id as Types.ObjectId
          );

          await assert.rejects(
            createProductRequestService(ownerA.toString(), {
              status: 'new',
              name: 'Conflicting create',
              article: occupiedArticle,
              categoryMode: 'catalog',
              categoryId: medicineCategoryId.toString(),
            }),

            (error: unknown) => {
              const httpError = error as HttpError;

              return (
                httpError.status === 409 &&
                httpError.code === 'PRODUCT_REQUEST_ARTICLE_CONFLICT'
              );
            }
          );

          await assert.rejects(
            updateProductRequestService(
              ownerA.toString(),
              String(editableRequest._id),

              {
                status: 'new',
                name: 'Conflicting update',
                article: occupiedArticle,
                categoryMode: 'catalog',
                categoryId: medicineCategoryId.toString(),
              }
            ),

            (error: unknown) => {
              const httpError = error as HttpError;

              return (
                httpError.status === 409 &&
                httpError.code === 'PRODUCT_REQUEST_ARTICLE_CONFLICT'
              );
            }
          );

          const persisted = await ProductRequest.findById(editableRequest._id)
            .select('article')
            .lean<{ article: string } | null>();

          assert.equal(persisted?.article, editableArticle);
        }
      );

      await context.test(
        'invalid transitions are rejected by the service',
        async () => {
          const request = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Invalid transition product',
            article: `REQ-INVALID-${suffix.slice(-10)}`,
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'new',
          });

          requestIds.push(request._id as Types.ObjectId);

          await assert.rejects(
            moderateProductRequestByAdminService(
              String(request._id),
              { status: 'on_moderation' },
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
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'on_moderation',
            fullDescription: 'Approved product description.',
            brand: 'Workflow Brand',
            series: 'Workflow Series',
            manufacturer: 'Workflow Manufacturer',
            releaseForm: 'Tablets',
            activeIngredients: 'Ingredient A',
            activeIngredientCount: 'Ingredient A: 10 mg',
          });

          requestIds.push(request._id as Types.ObjectId);

          const result = await moderateProductRequestByAdminService(
            String(request._id),
            { status: 'approved' },
            adminUserId.toString()
          );

          assert.equal(result.request.status, 'approved');
          assert.ok(result.request.productId);

          const adminActor = await User.findById(adminUserId)
            .select('name')
            .lean();

          assert.ok(adminActor?.name);

          assert.equal(
            (
              await getAdminProductRequestByIdService(String(request._id))
            ).request.history?.at(-1)?.actorName,
            adminActor.name
          );

          assert.equal(
            result.request.history?.at(-1)?.actorName,
            adminActor.name
          );

          assert.equal(
            (
              await getProductRequestByIdService(
                ownerA.toString(),
                String(request._id)
              )
            ).request.history?.at(-1)?.actorName,
            adminActor.name
          );

          await assert.rejects(() =>
            getProductRequestByIdService(ownerB.toString(), String(request._id))
          );

          const product = await Product.findById(result.request.productId)
            .select(
              '_id article brand series manufacturer releaseForm activeIngredients activeIngredientCount'
            )
            .lean<{
              _id: Types.ObjectId;
              article: string;
              brand?: string;
              series?: string;
              manufacturer?: string;
              releaseForm?: string;
              activeIngredients?: string;
              activeIngredientCount?: string;
            } | null>();

          assert.ok(product);
          assert.equal(product.article, article);
          assert.equal(product.brand, 'Workflow Brand');
          assert.equal(product.series, 'Workflow Series');
          assert.equal(product.manufacturer, 'Workflow Manufacturer');
          assert.equal(product.releaseForm, 'Tablets');
          assert.equal(product.activeIngredients, 'Ingredient A');
          assert.equal(product.activeIngredientCount, 'Ingredient A: 10 mg');
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
        'custom category metadata survives approval while the request gains a canonical category relation',
        async () => {
          const article = `REQ-CUSTOM-${suffix.slice(-10)}`;

          const request = await ProductRequest.create({
            pharmacyId: pharmacyA,
            name: 'Custom category request product',
            article,
            categoryMode: 'custom',
            customCategory: 'Herbal wellness blends',
            status: 'on_moderation',

            fullDescription:
              'Custom metadata must remain historical request data.',
          });

          requestIds.push(request._id as Types.ObjectId);

          const result = await moderateProductRequestByAdminService(
            String(request._id),
            {
              status: 'approved',
              categoryId: medicineCategoryId.toString(),
            },
            adminUserId.toString()
          );

          assert.equal(result.request.categoryMode, 'custom');
          assert.equal(result.request.customCategory, 'Herbal wellness blends');

          const category = await ProductCategory.findById(medicineCategoryId)
            .select('name slug color icon')
            .lean<{
              name: string;
              slug: string;
              color: string;
              icon: string;
            } | null>();

          assert.ok(category);

          assert.deepEqual(result.request.category, {
            id: medicineCategoryId.toString(),
            name: category.name,
            slug: category.slug,
            color: category.color,
            icon: category.icon,
          });

          assert.ok(result.request.productId);

          const product = await Product.findById(result.request.productId)
            .select('_id categoryId')
            .lean<{
              _id: Types.ObjectId;
              categoryId: Types.ObjectId;
            } | null>();

          assert.ok(product);

          assert.equal(
            String(product.categoryId),
            medicineCategoryId.toString()
          );

          productIds.push(product._id);

          const persistedRequest = await ProductRequest.findById(request._id)
            .select('categoryMode categoryId customCategory productId')

            .lean<{
              categoryMode: string;
              categoryId?: Types.ObjectId;
              customCategory?: string;
              productId?: Types.ObjectId;
            } | null>();

          assert.equal(persistedRequest?.categoryMode, 'custom');

          assert.equal(
            String(persistedRequest?.categoryId),
            medicineCategoryId.toString()
          );

          assert.equal(
            persistedRequest?.customCategory,
            'Herbal wellness blends'
          );

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
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'on_moderation',
          });

          requestIds.push(request._id as Types.ObjectId);

          const otherProduct = await Product.create({
            name: 'Different catalog product',
            article: `PRODUCT-OTHER-${suffix.slice(-10)}`,
            categoryId: medicineCategoryId,
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

          assert.equal(persistedRequest?.status, 'on_moderation');
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
            categoryMode: 'catalog',
            categoryId: medicineCategoryId,
            status: 'on_moderation',
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

        PharmacyNote.deleteMany({
          entityType: 'product_request',
          entityId: { $in: requestIds },
        }),

        Product.deleteMany({ _id: { $in: productIds } }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
        User.deleteMany({ _id: { $in: [ownerA, ownerB, adminUserId] } }),

        AdminAuditLog.deleteMany({
          actorUserId: { $in: [ownerA, ownerB, adminUserId] },
        }),

        ProductRequestAdminComment.deleteMany({
          productRequestId: { $in: requestIds },
        }),
      ]);

      await mongoose.disconnect();
    }
  }
);
