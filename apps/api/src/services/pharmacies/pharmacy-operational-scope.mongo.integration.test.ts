import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';

import { attachPharmacySelection } from '../../middlewares/pharmacies/pharmacy-selection.middleware';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { User } from '../../models/accounts/user.model';
import { Product } from '../../models/catalog/product.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { ProductRequest } from '../../models/catalog/productRequest.model';
import { Order } from '../../models/orders/order.model';
import { StockMovement } from '../../models/inventory/stockMovement.model';

import type { HttpError } from '../../types/http/errors';

import { seedIntegrationPharmacyActors } from '../__tests__/fixtures/pharmacy-integration-actors.helper';
import { getTestProductCategoryId } from '../catalog/__tests__/product-category-test.helper';
import { createManagerOrderService } from '../orders/order-manager-orders.service';

import {
  getOrdersService,
  getOrderByIdService,
} from '../orders/order-query.service';

import { updateOrderStatusService } from '../orders/order-mutations.service';
import { getOrderSalesStatisticsService } from '../orders/order-sales-statistics.service';

import {
  getClientsService,
  getClientByIdService,
} from '../clients/client-registry.service';

import { getClientPurchasedProductsService } from '../clients/client-purchases.service';

import {
  addProductToMyPharmacyService,
  removeProductFromMyPharmacyService,
  getManagedProductStatisticsService,
} from '../catalog/product-management.service';

import {
  createProductRequestService,
  deleteProductRequestService,
  updateProductRequestService,
} from '../catalog/product-request-management.service';

import {
  getProductRequestArticleAvailabilityService,
  getProductRequestByIdService,
  getProductRequestsService,
  getProductRequestStatisticsService,
} from '../catalog/product-request-read.service';

import {
  ordersQuerySchema,
  orderSalesStatisticsQuerySchema,
} from '../../schemas/orders/order.schema';

import {
  clientsQuerySchema,
  clientProductsQuerySchema,
} from '../../schemas/clients/client.schema';

import { productRequestsQuerySchema } from '../../schemas/catalog/product-request.schema';

//===================================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;

//===================================================================

// Exercise the real request-scoped AsyncLocalStorage selection middleware,
// not a mocked global pharmacy ID or a manually selected first membership.
function withSelectedPharmacy<T>(
  pharmacyId: string,
  action: () => Promise<T>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request = {
      get: (header: string) =>
        header.toLowerCase() === 'x-pharmacy-id' ? pharmacyId : undefined,
    } as unknown as Request;

    attachPharmacySelection(request, {} as Response, (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }

      void action().then(resolve, reject);
    });
  });
}

//===================================================================

async function expectStatus(action: () => Promise<unknown>, status: number) {
  await assert.rejects(action, (error: unknown) => {
    assert.equal((error as HttpError).status, status);

    return true;
  });
}

//===================================================================

function defaultClientPhone(id: Types.ObjectId): string {
  const digits = (BigInt(`0x${id.toHexString()}`) % 1_000_000_000n)
    .toString()
    .padStart(9, '0');

  return `+380${digits}`;
}

//===================================================================

test(
  '14.18.15: one owner, two pharmacies — orders, clients, offers, requests and sales stay selected-pharmacy-scoped',
  { skip: !TEST_MONGODB_URI },

  async () => {
    await mongoose.connect(TEST_MONGODB_URI!);

    const categoryId = await getTestProductCategoryId();

    const ownerId = new Types.ObjectId();
    const foreignOwnerId = new Types.ObjectId();
    const pharmacyA = new Types.ObjectId();
    const pharmacyB = new Types.ObjectId();
    const foreignPharmacy = new Types.ObjectId();
    const clientA = new Types.ObjectId();
    const clientB = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const additionalProductId = new Types.ObjectId();
    const offerA = new Types.ObjectId();
    const offerB = new Types.ObjectId();
    const pharmacyIds = [pharmacyA, pharmacyB, foreignPharmacy];
    const userIds = [ownerId, foreignOwnerId, clientA, clientB];
    const suffix = ownerId.toHexString().toUpperCase();
    const owner = ownerId.toHexString();
    const actor = { id: owner, role: 'pharmacy' as const };

    const orderQuery = ordersQuerySchema.parse({ page: 1, perPage: 20 });
    const clientsQuery = clientsQuerySchema.parse({ page: 1, perPage: 20 });

    const clientProductsQuery = clientProductsQuerySchema.parse({
      page: 1,
      perPage: 20,
    });

    const requestsQuery = productRequestsQuerySchema.parse({
      page: 1,
      perPage: 20,
    });

    const salesQuery = orderSalesStatisticsQuerySchema.parse({
      groupBy: 'month',
    });

    const requestIds: Types.ObjectId[] = [];
    const createdOfferIds: Types.ObjectId[] = [];

    try {
      await seedIntegrationPharmacyActors([ownerId, foreignOwnerId]);

      await Pharmacy.insertMany([
        {
          _id: pharmacyA,
          ownerId,
          name: `Scope A ${suffix.slice(-6)}`,
          managerUserIds: [],
          status: 'active',
          documents: [],
        },
        {
          _id: pharmacyB,
          ownerId,
          name: `Scope B ${suffix.slice(-6)}`,
          managerUserIds: [],
          status: 'active',
          documents: [],
        },
        {
          _id: foreignPharmacy,
          ownerId: foreignOwnerId,
          name: `Scope foreign ${suffix.slice(-6)}`,
          managerUserIds: [],
          status: 'active',
          documents: [],
        },
      ]);

      await User.insertMany(
        [clientA, clientB].map((id, index) => ({
          _id: id,
          name: index === 0 ? 'Scope Client First' : 'Scope Client Second',
          email: `scope-client-${id.toHexString()}@example.com`,
          password: 'test-password-hash',
          phone: defaultClientPhone(id),
          role: 'client',
          status: 'active',
          isDefaultPharmacyClient: true,
          defaultClientPharmacyId: index === 0 ? pharmacyA : pharmacyB,
        }))
      );

      await Product.insertMany([
        {
          _id: productId,
          name: `Scoped product ${suffix.slice(-6)}`,
          article: `SCOPE-${suffix.slice(-10)}`,
          categoryId,
          status: 'active',
          inStock: true,
        },
        {
          _id: additionalProductId,
          name: `Scoped extra ${suffix.slice(-6)}`,
          article: `EXTRA-${suffix.slice(-10)}`,
          categoryId,
          status: 'active',
          inStock: true,
        },
      ]);

      await ProductOffer.insertMany([
        {
          _id: offerA,
          productId,
          pharmacyId: pharmacyA,
          price: 100,
          totalQuantity: 10,
          availableQuantity: 10,
          reservedQuantity: 0,
        },
        {
          _id: offerB,
          productId,
          pharmacyId: pharmacyB,
          price: 200,
          totalQuantity: 10,
          availableQuantity: 10,
          reservedQuantity: 0,
        },
      ]);

      const createdA = await withSelectedPharmacy(pharmacyA.toHexString(), () =>
        createManagerOrderService(actor, {
          clientRequestId: '71c06d83-316c-48ee-b949-87ed41aba880',
          clientId: clientA.toHexString(),
          items: [{ productOfferId: offerA.toHexString(), quantity: 1 }],
          paymentMethod: 'cash',
          deliveryMethod: 'pickup',
          comment: '',
        })
      );

      const createdB = await withSelectedPharmacy(pharmacyB.toHexString(), () =>
        createManagerOrderService(actor, {
          clientRequestId: '71c06d83-316c-48ee-b949-87ed41aba881',
          clientId: clientB.toHexString(),
          items: [{ productOfferId: offerB.toHexString(), quantity: 2 }],
          paymentMethod: 'cash',
          deliveryMethod: 'pickup',
          comment: '',
        })
      );

      // A mutation without a selected pharmacy must fail, not target the first record.
      await expectStatus(
        () =>
          createManagerOrderService(actor, {
            clientRequestId: '71c06d83-316c-48ee-b949-87ed41aba882',
            clientId: clientA.toHexString(),
            items: [{ productOfferId: offerA.toHexString(), quantity: 1 }],
            paymentMethod: 'cash',
            deliveryMethod: 'pickup',
            comment: '',
          }),
        409
      );

      await expectStatus(
        () =>
          createProductRequestService(owner, {
            status: 'draft',
            name: 'Missing selected pharmacy',
            article: `REQ-NOSEL-${suffix.slice(-10)}`,
            categoryMode: 'catalog',
            categoryId: categoryId.toHexString(),
          }),
        409
      );

      // Even a valid selected A membership cannot reserve an offer owned by B.
      await expectStatus(
        () =>
          withSelectedPharmacy(pharmacyA.toHexString(), () =>
            createManagerOrderService(actor, {
              clientRequestId: '71c06d83-316c-48ee-b949-87ed41aba883',
              clientId: clientA.toHexString(),
              items: [{ productOfferId: offerB.toHexString(), quantity: 1 }],
              paymentMethod: 'cash',
              deliveryMethod: 'pickup',
              comment: '',
            })
          ),
        400
      );

      const offerBStillReserved = await ProductOffer.findById(offerB).lean<{
        reservedQuantity: number;
      } | null>();

      assert.equal(offerBStillReserved?.reservedQuantity, 2);

      // No fallback to an arbitrarily chosen pharmacy for any operational reader.
      await expectStatus(
        () => getOrdersService(owner, orderQuery, 'pharmacy'),
        409
      );

      await expectStatus(() => getClientsService(owner, clientsQuery), 409);

      await expectStatus(
        () =>
          getManagedProductStatisticsService({
            userId: owner,
            role: 'pharmacy',
          }),
        409
      );

      await expectStatus(() => getProductRequestStatisticsService(owner), 409);

      await expectStatus(
        () => getOrderSalesStatisticsService(owner, salesQuery, 'pharmacy'),
        409
      );

      for (const [selected, ownOrder, foreignOrder, ownClient] of [
        [pharmacyA, createdA, createdB, clientA],
        [pharmacyB, createdB, createdA, clientB],
      ] as const) {
        await withSelectedPharmacy(selected.toHexString(), async () => {
          const orders = await getOrdersService(owner, orderQuery, 'pharmacy');

          assert.equal(orders.total, 1);
          assert.equal(orders.items[0]?.id, ownOrder.order.id);

          // A valid uppercase ObjectId must identify the same pharmacy.
          const uppercaseOrders = await getOrdersService(
            owner,
            { ...orderQuery, pharmacyId: selected.toHexString().toUpperCase() },
            'pharmacy'
          );

          assert.equal(uppercaseOrders.total, 1);

          const clients = await getClientsService(owner, clientsQuery);

          assert.ok(
            clients.items.some((item) => item.id === ownClient.toHexString())
          );

          assert.ok(
            !clients.items.some(
              (item) =>
                item.id ===
                (ownClient === clientA ? clientB : clientA).toHexString()
            )
          );

          const client = await getClientByIdService(
            owner,
            ownClient.toHexString()
          );

          assert.equal(client.client.id, ownClient.toHexString());

          await expectStatus(
            () =>
              getClientByIdService(
                owner,
                (ownClient === clientA ? clientB : clientA).toHexString()
              ),
            404
          );

          await expectStatus(
            () => getOrderByIdService(owner, foreignOrder.order.id, 'pharmacy'),
            404
          );

          await expectStatus(
            () =>
              updateOrderStatusService(actor, foreignOrder.order.id, {
                status: 'successful',
              }),
            403
          );

          await expectStatus(
            () =>
              getOrdersService(
                owner,
                {
                  ...orderQuery,
                  pharmacyId: (selected === pharmacyA
                    ? pharmacyB
                    : pharmacyA
                  ).toHexString(),
                },
                'pharmacy'
              ),
            403
          );
        });
      }

      // The authenticated client cannot replace userId with an arbitrary clientId.
      await expectStatus(
        () =>
          getOrdersService(
            clientA.toHexString(),
            { ...orderQuery, clientId: clientB.toHexString() },
            'client'
          ),
        403
      );

      const ownClientOrders = await getOrdersService(
        clientA.toHexString(),
        { ...orderQuery, clientId: clientA.toHexString() },
        'client'
      );

      assert.equal(ownClientOrders.total, 1);
      assert.equal(ownClientOrders.items[0]?.id, createdA.order.id);

      // Confirm that client product history and successful sales cannot cross tenants.
      await withSelectedPharmacy(pharmacyA.toHexString(), async () => {
        await updateOrderStatusService(actor, createdA.order.id, {
          status: 'successful',
        });

        await getClientPurchasedProductsService(
          owner,
          clientA.toHexString(),
          clientProductsQuery
        );

        await expectStatus(
          () =>
            getClientPurchasedProductsService(
              owner,
              clientB.toHexString(),
              clientProductsQuery
            ),
          404
        );
      });

      await withSelectedPharmacy(pharmacyB.toHexString(), async () => {
        await updateOrderStatusService(actor, createdB.order.id, {
          status: 'successful',
        });
      });

      const salesTotal = async (id: Types.ObjectId) =>
        withSelectedPharmacy(id.toHexString(), async () => {
          const result = await getOrderSalesStatisticsService(
            owner,
            salesQuery,
            'pharmacy'
          );

          return result.points.reduce(
            (sum, point) =>
              sum +
              Object.values(point.values).reduce(
                (subtotal, value) => subtotal + (value?.amount ?? 0),
                0
              ),
            0
          );
        });

      assert.equal(await salesTotal(pharmacyA), 100);
      assert.equal(await salesTotal(pharmacyB), 400);

      const requestForm = (article: string) => ({
        status: 'draft' as const,
        name: 'Scoped pharmacy product request',
        article,
        categoryMode: 'catalog' as const,
        categoryId: categoryId.toHexString(),
      });

      const requestA = await withSelectedPharmacy(pharmacyA.toHexString(), () =>
        createProductRequestService(
          owner,
          requestForm(`REQ-A-${suffix.slice(-10)}`)
        )
      );

      const requestB = await withSelectedPharmacy(pharmacyB.toHexString(), () =>
        createProductRequestService(
          owner,
          requestForm(`REQ-B-${suffix.slice(-10)}`)
        )
      );

      requestIds.push(
        new Types.ObjectId(requestA.request.id),
        new Types.ObjectId(requestB.request.id)
      );

      await withSelectedPharmacy(pharmacyA.toHexString(), async () => {
        const requests = await getProductRequestsService(owner, requestsQuery);

        assert.equal(requests.total, 1);
        assert.equal(requests.items[0]?.id, requestA.request.id);
        const counts = await getProductRequestStatisticsService(owner);

        assert.equal(counts.draft, 1);

        await expectStatus(
          () => getProductRequestByIdService(owner, requestB.request.id),
          404
        );

        await expectStatus(
          () =>
            getProductRequestArticleAvailabilityService(owner, {
              article: `REQ-A-${suffix.slice(-10)}`,
              excludeRequestId: requestB.request.id,
            }),
          404
        );

        await expectStatus(
          () =>
            updateProductRequestService(
              owner,
              requestB.request.id,
              requestForm(`REQ-B-${suffix.slice(-10)}`)
            ),
          404
        );

        await expectStatus(
          () => deleteProductRequestService(owner, requestB.request.id),
          404
        );

        await addProductToMyPharmacyService(
          additionalProductId.toHexString(),
          owner
        );

        const extraOffer = await ProductOffer.findOne({
          pharmacyId: pharmacyA,
          productId: additionalProductId,
        });

        assert.ok(extraOffer);
        createdOfferIds.push(extraOffer._id as Types.ObjectId);

        const products = await getManagedProductStatisticsService({
          userId: owner,
          role: 'pharmacy',
        });

        assert.equal(products.addedToPharmacy, 2);
      });

      await withSelectedPharmacy(pharmacyB.toHexString(), async () => {
        const requests = await getProductRequestsService(owner, requestsQuery);

        assert.equal(requests.total, 1);
        assert.equal(requests.items[0]?.id, requestB.request.id);

        const counts = await getProductRequestStatisticsService(owner);

        assert.equal(counts.draft, 1);

        await expectStatus(
          () =>
            removeProductFromMyPharmacyService(
              additionalProductId.toHexString(),
              owner
            ),
          404
        );

        const products = await getManagedProductStatisticsService({
          userId: owner,
          role: 'pharmacy',
        });

        assert.equal(products.addedToPharmacy, 1);
      });

      await expectStatus(
        () =>
          withSelectedPharmacy(foreignPharmacy.toHexString(), () =>
            addProductToMyPharmacyService(
              additionalProductId.toHexString(),
              owner
            )
          ),
        403
      );

      await expectStatus(
        () =>
          withSelectedPharmacy(foreignPharmacy.toHexString(), () =>
            createProductRequestService(
              owner,
              requestForm(`REQ-FOREIGN-${suffix.slice(-10)}`)
            )
          ),
        403
      );

      // Reject a third-party pharmacy even when the header is a valid ObjectId.
      await expectStatus(
        () =>
          withSelectedPharmacy(foreignPharmacy.toHexString(), () =>
            getClientsService(owner, clientsQuery)
          ),
        403
      );
    } finally {
      await StockMovement.deleteMany({
        productOfferId: { $in: [offerA, offerB, ...createdOfferIds] },
      });

      await Order.deleteMany({ pharmacyId: { $in: pharmacyIds } });
      await ProductRequest.deleteMany({ _id: { $in: requestIds } });
      await ProductOffer.deleteMany({ pharmacyId: { $in: pharmacyIds } });

      await Product.deleteMany({
        _id: { $in: [productId, additionalProductId] },
      });

      await Pharmacy.deleteMany({ _id: { $in: pharmacyIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      await mongoose.disconnect();
    }
  }
);
