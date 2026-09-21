import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductRequest } from '../models/productRequest.model';
import { User } from '../models/user.model';
import type { HttpError } from '../types/errors';

import {
  createManagerOrderService,
  createOrderManagerCommentService,
  deleteOrderManagerCommentService,
  getOrderManagerCommentsService,
  updateOrderDetailsService,
  updateOrderStatusService,
} from './order.service';

import {
  createProductRequestService,
  deleteProductRequestService,
  updateProductRequestService,
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

function getPhoneSuffix(seed: string): string {
  return String(Number.parseInt(seed.slice(-6), 16) % 10_000_000).padStart(
    7,
    '0'
  );
}

//===================================================================

async function expectHttpStatus(
  action: () => Promise<unknown>,
  expectedStatus: number
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    assert.equal((error as HttpError).status, expectedStatus);
    return true;
  });
}

//===================================================================

test(
  'operational pharmacy mutations require active or on_moderation status while reads and tenant isolation remain intact',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());
    await Promise.all([Order.syncIndexes(), ProductRequest.init()]);

    const suffix = new Types.ObjectId().toHexString().toUpperCase();
    const ownerA = new Types.ObjectId();
    const managerA = new Types.ObjectId();
    const ownerB = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const offerId = new Types.ObjectId();
    const clientId = new Types.ObjectId();

    await Promise.all([
      Pharmacy.create({
        _id: pharmacyA,
        ownerId: ownerA,
        managerUserIds: [managerA],
        documents: [],
        name: `Operational Pharmacy A ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Pharmacy.create({
        _id: pharmacyB,
        ownerId: ownerB,
        managerUserIds: [],
        documents: [],
        name: `Operational Pharmacy B ${suffix.slice(-6)}`,
        status: 'active',
      }),

      Product.create({
        _id: productId,
        name: `Operational Product ${suffix.slice(-6)}`,
        article: `OPS-${suffix.slice(-10)}`,
        category: 'medicine',
        status: 'active',
        inStock: true,
      }),

      User.create({
        _id: managerA,
        name: 'Operational Manager',
        email: `operational-manager-${suffix.toLowerCase()}@example.com`,
        password: 'test-password-hash',
        role: 'pharmacy',
        status: 'active',
        phone: `+38093${getPhoneSuffix(suffix)}`,
      }),

      User.create({
        _id: clientId,
        name: 'Operational Test Client',
        email: `operational-client-${suffix.toLowerCase()}@example.com`,
        password: 'test-password-hash',
        role: 'client',
        status: 'active',
        phone: `+38050${getPhoneSuffix(suffix)}`,
        isDefaultPharmacyClient: true,
        defaultClientPharmacyId: pharmacyA,
      }),
    ]);

    await ProductOffer.create({
      _id: offerId,
      productId,
      pharmacyId: pharmacyA,
      price: 100,
      totalQuantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });

    const ownerActor = { id: ownerA.toString(), role: 'pharmacy' as const };

    const managerActor = {
      id: managerA.toString(),
      role: 'pharmacy' as const,
    };

    const foreignActor = { id: ownerB.toString(), role: 'pharmacy' as const };

    const requestUpdateArticle = `OPS-REQ-U-${suffix.slice(-8)}`;
    const requestDeleteArticle = `OPS-REQ-D-${suffix.slice(-8)}`;

    try {
      // Active is operational: creation flows remain allowed.
      const createdOrder = await createManagerOrderService(ownerActor, {
        clientRequestId: '1c07caf4-21e5-4657-8964-94082706e0e7',
        clientId: clientId.toString(),
        items: [{ productOfferId: offerId.toString(), quantity: 1 }],
        paymentMethod: 'cash',
        deliveryMethod: 'pickup',
        comment: '',
      });

      await updateOrderStatusService(ownerActor, createdOrder.order.id, {
        status: 'in_progress',
      });

      const existingComment = await createOrderManagerCommentService(
        managerActor,
        createdOrder.order.id,
        {
          text: 'Existing comment before block',
          clientRequestId: '998a407f-6875-457d-932e-df069990076c',
        }
      );

      const updateRequest = await createProductRequestService(
        ownerA.toString(),
        {
          status: 'draft',
          name: 'Operational request update',
          article: requestUpdateArticle,
          category: 'medicine',
        }
      );

      const deleteRequest = await createProductRequestService(
        managerA.toString(),
        {
          status: 'draft',
          name: 'Operational request delete',
          article: requestDeleteArticle,
          category: 'medicine',
        }
      );

      // Foreign tenant stays denied before status becomes relevant.
      await expectHttpStatus(
        () =>
          updateOrderDetailsService(foreignActor, createdOrder.order.id, {
            paymentMethod: 'cash',
          }),
        403
      );

      await expectHttpStatus(
        () =>
          updateProductRequestService(
            ownerB.toString(),
            updateRequest.request.id,
            {
              status: 'draft',
              name: 'Foreign update attempt',
              article: requestUpdateArticle,
              category: 'medicine',
            }
          ),
        404
      );

      await Pharmacy.updateOne(
        { _id: pharmacyA },
        { $set: { status: 'blocked' } }
      );

      // Blocked owner and manager cannot edit an existing order.
      await expectHttpStatus(
        () =>
          updateOrderDetailsService(ownerActor, createdOrder.order.id, {
            paymentMethod: 'cash',
          }),
        403
      );

      await expectHttpStatus(
        () =>
          updateOrderDetailsService(managerActor, createdOrder.order.id, {
            paymentMethod: 'cash',
          }),
        403
      );

      // Status transitions with inventory side effects are also blocked.
      await expectHttpStatus(
        () =>
          updateOrderStatusService(ownerActor, createdOrder.order.id, {
            status: 'successful',
          }),
        403
      );

      await expectHttpStatus(
        () =>
          updateOrderStatusService(managerActor, createdOrder.order.id, {
            status: 'rejected',
            rejectionReason: 'Blocked pharmacy regression test',
          }),
        403
      );

      // Manager comments remain readable but cannot be mutated while blocked.
      const blockedComments = await getOrderManagerCommentsService(
        managerActor,
        createdOrder.order.id,
        { page: 1, perPage: 10 }
      );
      assert.equal(blockedComments.total, 1);

      await expectHttpStatus(
        () =>
          createOrderManagerCommentService(
            managerActor,
            createdOrder.order.id,
            {
              text: 'Blocked create attempt',
              clientRequestId: '6399b742-9fa1-437d-948d-2d7e3ccfb7e4',
            }
          ),
        403
      );

      await expectHttpStatus(
        () =>
          deleteOrderManagerCommentService(
            ownerActor,
            createdOrder.order.id,
            existingComment.comment.id
          ),
        403
      );

      // Existing product-request drafts cannot be edited, submitted or deleted.
      await expectHttpStatus(
        () =>
          updateProductRequestService(
            ownerA.toString(),
            updateRequest.request.id,
            {
              status: 'draft',
              name: 'Blocked update attempt',
              article: requestUpdateArticle,
              category: 'medicine',
            }
          ),
        403
      );

      await expectHttpStatus(
        () =>
          updateProductRequestService(
            managerA.toString(),
            updateRequest.request.id,
            {
              status: 'new',
              name: 'Blocked submit attempt',
              article: requestUpdateArticle,
              category: 'medicine',
            }
          ),
        403
      );

      await expectHttpStatus(
        () =>
          deleteProductRequestService(
            managerA.toString(),
            deleteRequest.request.id
          ),
        403
      );

      const blockedOffer = await ProductOffer.findById(offerId)
        .select('availableQuantity reservedQuantity totalQuantity')
        .lean<{
          availableQuantity: number;
          reservedQuantity: number;
          totalQuantity: number;
        } | null>();

      assert.ok(blockedOffer);
      assert.equal(blockedOffer.totalQuantity, 5);
      assert.equal(blockedOffer.availableQuantity, 4);
      assert.equal(blockedOffer.reservedQuantity, 1);

      const persistedOrder = await Order.findById(createdOrder.order.id)
        .select('status managerComments')
        .lean<{
          status: string;
          managerComments?: unknown[];
        } | null>();

      assert.equal(persistedOrder?.status, 'in_progress');
      assert.equal(persistedOrder?.managerComments?.length, 1);

      const persistedUpdateRequest = await ProductRequest.findById(
        updateRequest.request.id
      )
        .select('status name')
        .lean<{ status: string; name: string } | null>();

      assert.equal(persistedUpdateRequest?.status, 'draft');
      assert.equal(persistedUpdateRequest?.name, 'Operational request update');

      // on_moderation remains operational for the same existing-resource paths.
      await Pharmacy.updateOne(
        { _id: pharmacyA },
        { $set: { status: 'on_moderation' } }
      );

      const updatedOrder = await updateOrderDetailsService(
        managerActor,
        createdOrder.order.id,
        { managerComment: 'Allowed while on moderation' }
      );

      assert.equal(
        updatedOrder.order.managerComment,
        'Allowed while on moderation'
      );

      const moderationComment = await createOrderManagerCommentService(
        ownerActor,
        createdOrder.order.id,
        {
          text: 'Allowed moderation comment',
          clientRequestId: '6e01e28e-8d9b-4330-b9e2-f9c469047300',
        }
      );

      await deleteOrderManagerCommentService(
        ownerActor,
        createdOrder.order.id,
        moderationComment.comment.id
      );

      const submittedRequest = await updateProductRequestService(
        ownerA.toString(),
        updateRequest.request.id,
        {
          status: 'new',
          name: 'Submitted while on moderation',
          article: requestUpdateArticle,
          category: 'medicine',
        }
      );

      assert.equal(submittedRequest.request.status, 'new');

      await deleteProductRequestService(
        managerA.toString(),
        deleteRequest.request.id
      );

      const deletedRequest = await ProductRequest.findById(
        deleteRequest.request.id
      )
        .select('_id')
        .lean();
      assert.equal(deletedRequest, null);
    } finally {
      await Promise.all([
        Order.deleteMany({ pharmacyId: { $in: [pharmacyA, pharmacyB] } }),
        ProductRequest.deleteMany({
          pharmacyId: { $in: [pharmacyA, pharmacyB] },
        }),

        ProductOffer.deleteOne({ _id: offerId }),
        Product.deleteOne({ _id: productId }),
        Pharmacy.deleteMany({ _id: { $in: [pharmacyA, pharmacyB] } }),
        User.deleteMany({ _id: { $in: [clientId, managerA] } }),
      ]);

      await mongoose.disconnect();
    }
  }
);
