import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import {
  CHECKOUT_GROUP_MISSING_ERROR_CODE,
  PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE,
} from '../constants/order';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { User } from '../models/user.model';
import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';

import {
  checkoutOrderService,
  getOrderByIdService,
  getOrderSalesStatisticsService,
  updateOrderDetailsService,
  updateOrderStatusService,
} from './order.service';

import {
  commitReservedStock,
  releaseOfferStock,
  reserveOfferStock,
} from './stock.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;
const CHECKOUT_OFFER_PRICE = 100;

//===============================================================

function getPhoneSuffix(seed: string): string {
  return String(Number.parseInt(seed.slice(-6), 16) % 10_000_000).padStart(
    7,
    '0'
  );
}

//===============================================================

function getTestMongoUri(): string {
  if (!TEST_MONGODB_URI) {
    throw new Error(
      'E_PHARMACY_TEST_MONGODB_URI is required for Mongo integration tests.'
    );
  }

  return TEST_MONGODB_URI;
}

//===============================================================

const BANK_DETAILS_A = {
  recipientName: 'Health Pharmacy LLC',
  taxId: '12345678',
  iban: 'UA123456789012345678901234567',
  bankName: 'Example Bank',
  paymentPurpose: 'Payment for medicines',
  receiptEmail: 'billing-a@example.com',
} as const;

const BANK_DETAILS_B = {
  ...BANK_DETAILS_A,
  iban: 'UA223456789012345678901234567',
  receiptEmail: 'billing-b@example.com',
} as const;

//===============================================================

type CheckoutFixture = Readonly<{
  clientUserId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  pharmacyOwnerId: Types.ObjectId;
  productId: Types.ObjectId;
  offerId: Types.ObjectId;
  cartId: Types.ObjectId;
  cartItemId: Types.ObjectId;
  revision: number;
  groupFingerprint: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
}>;

//===============================================================

async function createCheckoutFixture(options?: {
  stock?: number;
  bankDetails?: typeof BANK_DETAILS_A;
}): Promise<CheckoutFixture> {
  const suffix = new Types.ObjectId().toHexString().slice(-10).toUpperCase();
  const clientUserId = new Types.ObjectId();
  const pharmacyOwnerId = new Types.ObjectId();
  const pharmacyId = new Types.ObjectId();
  const productId = new Types.ObjectId();
  const offerId = new Types.ObjectId();

  const clientName = 'Checkout Test Client';
  const clientPhone = `+38050${getPhoneSuffix(suffix)}`;
  const clientAddress = 'Kyiv, Client Street 15';

  await Promise.all([
    Pharmacy.create({
      _id: pharmacyId,
      ownerId: pharmacyOwnerId,
      managerUserIds: [],
      documents: [],
      name: `Checkout Test Pharmacy ${suffix}`,
      address: 'Kyiv, Main Street 10',
      city: 'Kyiv',
      phone: '+380501234567',
      email: `checkout-${suffix.toLowerCase()}@example.com`,
      status: 'active',
      ...(options?.bankDetails ? { bankDetails: options.bankDetails } : {}),
    }),

    Product.create({
      _id: productId,
      name: `Checkout Test Product ${suffix}`,
      article: `CT-${suffix}`,
      status: 'active',
      category: 'medicine',
      inStock: true,
    }),

    User.create({
      _id: clientUserId,
      name: clientName,
      email: `checkout-client-${suffix.toLowerCase()}@example.com`,
      password: 'test-password-hash',
      role: 'client',
      status: 'active',
      phone: clientPhone,
      address: clientAddress,
    }),
  ]);

  const stock = options?.stock ?? 5;
  await ProductOffer.create({
    _id: offerId,
    productId,
    pharmacyId,
    price: CHECKOUT_OFFER_PRICE,
    totalQuantity: stock,
    availableQuantity: stock,
    reservedQuantity: 0,
  });

  const createdCart = await Cart.create({
    clientUserId,
    revision: 0,
    items: [
      {
        productOfferId: offerId,
        quantity: 1,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    ],
  });

  const cart = await Cart.findById(createdCart._id).lean<{
    _id: Types.ObjectId;
    revision: number;
    items: Array<{
      _id: Types.ObjectId;
      productOfferId: Types.ObjectId;
      quantity: number;
    }>;
  } | null>();

  assert.ok(cart);
  assert.equal(cart.items.length, 1);

  const cartItem = cart.items[0];
  const groupFingerprint = createCheckoutGroupFingerprint({
    pharmacyId: pharmacyId.toString(),
    items: [
      {
        id: cartItem._id,
        productOfferId: cartItem.productOfferId,
        quantity: cartItem.quantity,
        unitPrice: CHECKOUT_OFFER_PRICE,
      },
    ],
  });

  return {
    clientUserId,
    pharmacyId,
    pharmacyOwnerId,
    productId,
    offerId,
    cartId: cart._id,
    cartItemId: cartItem._id,
    revision: cart.revision,
    groupFingerprint,
    clientName,
    clientPhone,
    clientAddress,
  };
}

//===============================================================

async function removeFixture(fixture: CheckoutFixture): Promise<void> {
  await Promise.all([
    Order.deleteMany({ userId: fixture.clientUserId }),
    Cart.deleteOne({ _id: fixture.cartId }),
    ProductOffer.deleteOne({ _id: fixture.offerId }),
    Product.deleteOne({ _id: fixture.productId }),
    Pharmacy.deleteOne({ _id: fixture.pharmacyId }),
    User.deleteOne({ _id: fixture.clientUserId }),
  ]);
}

//===============================================================

async function checkoutFixture(fixture: CheckoutFixture) {
  return checkoutOrderService(fixture.clientUserId.toString(), {
    pharmacyId: fixture.pharmacyId.toString(),
    expectedCartRevision: fixture.revision,
    groupFingerprint: fixture.groupFingerprint,
    paymentMethod: 'cash',
    deliveryMethod: 'pickup',
  });
}

//===============================================================

test(
  'Mongo lifecycle keeps checkout snapshot immutable and stock reservation transactional',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture({
      bankDetails: BANK_DETAILS_A,
    });

    try {
      const response = await checkoutFixture(fixture);

      assert.equal(response.cart.items.length, 0);
      assert.equal(response.order.bankDetails?.iban, BANK_DETAILS_A.iban);

      const reservedOffer = await ProductOffer.findById(fixture.offerId).lean<{
        totalQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(reservedOffer);
      assert.equal(reservedOffer.totalQuantity, 5);
      assert.equal(reservedOffer.availableQuantity, 4);
      assert.equal(reservedOffer.reservedQuantity, 1);

      await Pharmacy.updateOne(
        { _id: fixture.pharmacyId },
        {
          $set: {
            address: 'Kyiv, Changed Street 99',
            bankDetails: BANK_DETAILS_B,
          },
        }
      );

      const historical = await getOrderByIdService(
        fixture.clientUserId.toString(),
        response.order.id
      );

      assert.equal(
        historical.order.pharmacyAddress,
        'Kyiv, Main Street 10, Kyiv'
      );
      assert.equal(historical.order.bankDetails?.iban, BANK_DETAILS_A.iban);
      assert.equal(
        historical.order.bankDetails?.receiptEmail,
        BANK_DETAILS_A.receiptEmail
      );
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'Mongo transaction rolls back a reservation when later work fails',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture({ stock: 3 });
    const session = await mongoose.startSession();

    try {
      await assert.rejects(
        session.withTransaction(async () => {
          await reserveOfferStock(fixture.offerId, 2, session);
          throw new Error('force rollback');
        }),
        /force rollback/
      );

      const afterRollback = await ProductOffer.findById(fixture.offerId).lean<{
        totalQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(afterRollback);
      assert.equal(afterRollback.totalQuantity, 3);
      assert.equal(afterRollback.availableQuantity, 3);
      assert.equal(afterRollback.reservedQuantity, 0);

      await session.withTransaction(async () => {
        await reserveOfferStock(fixture.offerId, 2, session);
      });

      await session.withTransaction(async () => {
        await releaseOfferStock(fixture.offerId, 1, session);
      });

      await session.withTransaction(async () => {
        await commitReservedStock(fixture.offerId, 1, session);
      });

      const afterLifecycle = await ProductOffer.findById(fixture.offerId).lean<{
        totalQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(afterLifecycle);
      assert.equal(afterLifecycle.totalQuantity, 2);
      assert.equal(afterLifecycle.availableQuantity, 2);
      assert.equal(afterLifecycle.reservedQuantity, 0);
    } finally {
      await session.endSession();
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'backend rejects bank transfer edits when the confirmed order snapshot has no bank details',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture();

    try {
      const response = await checkoutFixture(fixture);
      await Order.updateOne(
        { _id: response.order.id },
        { $set: { status: 'in_progress' } }
      );

      await assert.rejects(
        updateOrderDetailsService(
          { id: fixture.pharmacyOwnerId.toString(), role: 'pharmacy' },
          response.order.id,
          { paymentMethod: 'bank_transfer' }
        ),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE
      );
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'retrying the same checkout after a committed response is lost cannot create a duplicate order',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture({ stock: 2 });

    try {
      // The first checkout represents a server-side commit whose HTTP response
      // is lost before the browser can observe it.
      await checkoutFixture(fixture);

      await assert.rejects(
        checkoutFixture(fixture),
        (error: unknown) =>
          error instanceof Error &&
          'code' in error &&
          error.code === CHECKOUT_GROUP_MISSING_ERROR_CODE
      );

      assert.equal(
        await Order.countDocuments({ userId: fixture.clientUserId }),
        1
      );

      const cart = await Cart.findById(fixture.cartId).lean<{
        revision: number;
        items: unknown[];
      } | null>();

      assert.ok(cart);
      assert.equal(cart.revision, fixture.revision + 1);
      assert.equal(cart.items.length, 0);

      const offer = await ProductOffer.findById(fixture.offerId).lean<{
        totalQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(offer);
      assert.equal(offer.totalQuantity, 2);
      assert.equal(offer.availableQuantity, 1);
      assert.equal(offer.reservedQuantity, 1);
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'only one checkout can reserve the last available unit',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const first = await createCheckoutFixture({ stock: 1 });
    const secondClientUserId = new Types.ObjectId();
    const secondCart = await Cart.create({
      clientUserId: secondClientUserId,
      revision: 0,
      items: [
        {
          productOfferId: first.offerId,
          quantity: 1,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      ],
    });

    const secondCartSnapshot = await Cart.findById(secondCart._id).lean<{
      revision: number;
      items: Array<{
        _id: Types.ObjectId;
        productOfferId: Types.ObjectId;
        quantity: number;
      }>;
    } | null>();

    assert.ok(secondCartSnapshot);
    const secondFingerprint = createCheckoutGroupFingerprint({
      pharmacyId: first.pharmacyId.toString(),
      items: secondCartSnapshot.items.map((item) => ({
        id: item._id,
        productOfferId: item.productOfferId,
        quantity: item.quantity,
        unitPrice: CHECKOUT_OFFER_PRICE,
      })),
    });

    try {
      const results = await Promise.allSettled([
        checkoutFixture(first),
        checkoutOrderService(secondClientUserId.toString(), {
          pharmacyId: first.pharmacyId.toString(),
          expectedCartRevision: secondCartSnapshot.revision,
          groupFingerprint: secondFingerprint,
          paymentMethod: 'cash',
          deliveryMethod: 'pickup',
        }),
      ]);

      assert.equal(
        results.filter((result) => result.status === 'fulfilled').length,
        1
      );

      assert.equal(
        results.filter((result) => result.status === 'rejected').length,
        1
      );

      const offer = await ProductOffer.findById(first.offerId).lean<{
        totalQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
      } | null>();

      assert.ok(offer);
      assert.equal(offer.totalQuantity, 1);
      assert.equal(offer.availableQuantity, 0);
      assert.equal(offer.reservedQuantity, 1);

      assert.equal(
        await Order.countDocuments({
          userId: { $in: [first.clientUserId, secondClientUserId] },
        }),
        1
      );
    } finally {
      await Order.deleteMany({ userId: secondClientUserId });
      await Cart.deleteOne({ _id: secondCart._id });
      await removeFixture(first);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'order details keep the historical client snapshot after the client profile changes',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture();

    try {
      const checkout = await checkoutFixture(fixture);

      await User.updateOne(
        { _id: fixture.clientUserId },
        {
          $set: {
            name: 'Updated Client Profile',
            phone: `+38067${getPhoneSuffix(new Types.ObjectId().toHexString())}`,
            address: 'Odesa, Updated Street 25',
          },
        }
      );

      const reloaded = await getOrderByIdService(
        fixture.clientUserId.toString(),
        checkout.order.id
      );

      assert.equal(reloaded.order.client, fixture.clientName);
      assert.equal(reloaded.order.clientPhone, fixture.clientPhone);
      assert.equal(reloaded.order.clientAddress, fixture.clientAddress);
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'successful sales use successfulAt instead of order creation time',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture();
    const actor = {
      id: fixture.pharmacyOwnerId.toString(),
      role: 'pharmacy' as const,
    };

    try {
      const checkout = await checkoutFixture(fixture);

      await updateOrderStatusService(actor, checkout.order.id, {
        status: 'in_progress',
      });

      await updateOrderStatusService(actor, checkout.order.id, {
        status: 'successful',
      });

      const completedOrder = await Order.findById(checkout.order.id).lean<{
        successfulAt?: Date;
        statusHistory: Array<{ status: string; changedAt: Date }>;
      } | null>();

      assert.ok(completedOrder);

      const successfulAt = completedOrder.successfulAt;
      assert.ok(successfulAt);

      const successfulHistoryEntries = completedOrder.statusHistory.filter(
        (entry) => entry.status === 'successful'
      );

      assert.equal(successfulHistoryEntries.length, 1);

      const successfulHistoryEntry = successfulHistoryEntries[0];
      assert.ok(successfulHistoryEntry);
      assert.equal(
        successfulAt.getTime(),
        successfulHistoryEntry.changedAt.getTime()
      );

      const previousMonth = new Date(
        Date.UTC(
          successfulAt.getUTCFullYear(),
          successfulAt.getUTCMonth() - 1,
          15
        )
      );

      await Order.collection.updateOne(
        { _id: new Types.ObjectId(checkout.order.id) },
        { $set: { createdAt: previousMonth } }
      );

      await Promise.all([
        Product.updateOne(
          { _id: fixture.productId },
          {
            $set: {
              name: 'Renamed after successful order',
              category: 'beauty',
            },
          }
        ),
        ProductOffer.updateOne(
          { _id: fixture.offerId },
          { $set: { price: CHECKOUT_OFFER_PRICE * 9 } }
        ),
      ]);

      const previousYear = previousMonth.getUTCFullYear();
      const previousMonthIndex = previousMonth.getUTCMonth();

      const previousMonthFrom = `${previousYear}-${String(
        previousMonthIndex + 1
      ).padStart(2, '0')}-01`;

      const previousMonthLastDay = new Date(
        Date.UTC(previousYear, previousMonthIndex + 1, 0)
      ).getUTCDate();

      const previousMonthTo = `${previousYear}-${String(
        previousMonthIndex + 1
      ).padStart(2, '0')}-${String(previousMonthLastDay).padStart(2, '0')}`;

      const previousPeriodStatistics = await getOrderSalesStatisticsService(
        fixture.pharmacyOwnerId.toString(),
        {
          dateFrom: previousMonthFrom,
          dateTo: previousMonthTo,
          groupBy: 'month',
        },
        'pharmacy'
      );

      assert.deepEqual(previousPeriodStatistics.categories, []);

      const year = successfulAt.getUTCFullYear();
      const month = successfulAt.getUTCMonth();
      const currentMonthFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;

      const currentMonthLastDay = new Date(
        Date.UTC(year, month + 1, 0)
      ).getUTCDate();

      const currentMonthTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentMonthLastDay).padStart(2, '0')}`;

      const statistics = await getOrderSalesStatisticsService(
        fixture.pharmacyOwnerId.toString(),
        {
          dateFrom: currentMonthFrom,
          dateTo: currentMonthTo,
          groupBy: 'month',
        },
        'pharmacy'
      );

      assert.equal(statistics.points.length, 1);
      assert.deepEqual(statistics.categories, ['medicine']);
      assert.equal(statistics.points[0]?.values.medicine?.quantity, 1);

      assert.equal(
        statistics.points[0]?.values.medicine?.amount,
        CHECKOUT_OFFER_PRICE
      );

      const successfulDay = successfulAt.toISOString().slice(0, 10);
      const dailyStatistics = await getOrderSalesStatisticsService(
        fixture.pharmacyOwnerId.toString(),
        {
          dateFrom: successfulDay,
          dateTo: successfulDay,
          groupBy: 'day',
        },
        'pharmacy'
      );

      assert.equal(dailyStatistics.points.length, 1);
      assert.deepEqual(dailyStatistics.categories, ['medicine']);
      assert.equal(
        dailyStatistics.points[0]?.values.medicine?.amount,
        CHECKOUT_OFFER_PRICE
      );
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'rejected orders never contribute to sales statistics',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture();
    const actor = {
      id: fixture.pharmacyOwnerId.toString(),
      role: 'pharmacy' as const,
    };

    try {
      const checkout = await checkoutFixture(fixture);

      await updateOrderStatusService(actor, checkout.order.id, {
        status: 'in_progress',
      });

      await updateOrderStatusService(actor, checkout.order.id, {
        status: 'rejected',
        rejectionReason: 'Rejected analytics regression test',
      });

      const rejectedOrder = await Order.findById(checkout.order.id)
        .select('successfulAt status')
        .lean<{ status: string; successfulAt?: Date } | null>();

      assert.ok(rejectedOrder);
      assert.equal(rejectedOrder.status, 'rejected');
      assert.equal(rejectedOrder.successfulAt, undefined);

      const year = new Date().getUTCFullYear();
      const statistics = await getOrderSalesStatisticsService(
        fixture.pharmacyOwnerId.toString(),
        {
          dateFrom: `${year}-01-01`,
          dateTo: `${year}-12-31`,
          groupBy: 'month',
        },
        'pharmacy'
      );

      assert.deepEqual(statistics.categories, []);

      assert.ok(
        statistics.points.every(
          (point) => Object.keys(point.values).length === 0
        )
      );
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'sales statistics remain isolated to the authenticated pharmacy',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixtureA = await createCheckoutFixture();
    const fixtureB = await createCheckoutFixture();

    const actorA = {
      id: fixtureA.pharmacyOwnerId.toString(),
      role: 'pharmacy' as const,
    };

    const actorB = {
      id: fixtureB.pharmacyOwnerId.toString(),
      role: 'pharmacy' as const,
    };

    try {
      const [checkoutA, checkoutB] = await Promise.all([
        checkoutFixture(fixtureA),
        checkoutFixture(fixtureB),
      ]);

      await Promise.all([
        updateOrderStatusService(actorA, checkoutA.order.id, {
          status: 'in_progress',
        }),

        updateOrderStatusService(actorB, checkoutB.order.id, {
          status: 'in_progress',
        }),
      ]);

      await Promise.all([
        updateOrderStatusService(actorA, checkoutA.order.id, {
          status: 'successful',
        }),

        updateOrderStatusService(actorB, checkoutB.order.id, {
          status: 'successful',
        }),
      ]);

      const year = new Date().getUTCFullYear();

      const statistics = await getOrderSalesStatisticsService(
        fixtureA.pharmacyOwnerId.toString(),
        {
          dateFrom: `${year}-01-01`,
          dateTo: `${year}-12-31`,
          groupBy: 'month',
        },
        'pharmacy'
      );

      const totalAmount = statistics.points.reduce(
        (pointsTotal, point) =>
          pointsTotal +
          Object.values(point.values).reduce(
            (pointTotal, value) => pointTotal + value.amount,
            0
          ),
        0
      );

      assert.equal(totalAmount, CHECKOUT_OFFER_PRICE);
    } finally {
      await Promise.all([removeFixture(fixtureA), removeFixture(fixtureB)]);
      await mongoose.disconnect();
    }
  }
);

//===============================================================

test(
  'concurrent terminal status changes commit exactly one stock outcome',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const fixture = await createCheckoutFixture({ stock: 5 });
    const actor = {
      id: fixture.pharmacyOwnerId.toString(),
      role: 'pharmacy' as const,
    };

    try {
      const checkout = await checkoutFixture(fixture);

      await updateOrderStatusService(actor, checkout.order.id, {
        status: 'in_progress',
      });

      const results = await Promise.allSettled([
        updateOrderStatusService(actor, checkout.order.id, {
          status: 'successful',
        }),
        updateOrderStatusService(actor, checkout.order.id, {
          status: 'rejected',
          rejectionReason: 'Concurrent rejection test',
        }),
      ]);

      const fulfilled = results.filter(
        (result) => result.status === 'fulfilled'
      );
      const rejected = results.filter((result) => result.status === 'rejected');

      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 1);

      const rejectedError = rejected[0]?.reason as { status?: number };
      assert.equal(rejectedError.status, 409);

      const [order, offer] = await Promise.all([
        Order.findById(checkout.order.id).lean<{
          status: 'successful' | 'rejected';
          statusHistory: Array<{ status: string }>;
        } | null>(),
        ProductOffer.findById(fixture.offerId).lean<{
          totalQuantity: number;
          availableQuantity: number;
          reservedQuantity: number;
        } | null>(),
      ]);

      assert.ok(order);
      assert.ok(offer);
      assert.ok(order.status === 'successful' || order.status === 'rejected');
      assert.equal(
        order.statusHistory.filter(
          (entry) =>
            entry.status === 'successful' || entry.status === 'rejected'
        ).length,
        1
      );
      assert.equal(offer.reservedQuantity, 0);

      if (order.status === 'successful') {
        assert.equal(offer.totalQuantity, 4);
        assert.equal(offer.availableQuantity, 4);
      } else {
        assert.equal(offer.totalQuantity, 5);
        assert.equal(offer.availableQuantity, 5);
      }
    } finally {
      await removeFixture(fixture);
      await mongoose.disconnect();
    }
  }
);
