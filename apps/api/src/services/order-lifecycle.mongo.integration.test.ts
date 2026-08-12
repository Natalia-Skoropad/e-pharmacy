import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose, { Types } from 'mongoose';

import { PAYMENT_METHOD_UNAVAILABLE_ERROR_CODE } from '../constants/order';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Pharmacy } from '../models/pharmacy.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { createCheckoutGroupFingerprint } from './checkout-group-fingerprint';

import {
  checkoutOrderService,
  getOrderByIdService,
  updateOrderDetailsService,
} from './order.service';

import {
  commitReservedStock,
  releaseOfferStock,
  reserveOfferStock,
} from './stock.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;

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

  await Pharmacy.create({
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
  });

  await Product.create({
    _id: productId,
    name: `Checkout Test Product ${suffix}`,
    article: `CT-${suffix}`,
    status: 'active',
    category: 'medicine',
    inStock: true,
  });

  const stock = options?.stock ?? 5;
  await ProductOffer.create({
    _id: offerId,
    productId,
    pharmacyId,
    price: 100,
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
        unitPrice: 100,
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
      unitPrice: number;
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
        unitPrice: cartItem.unitPrice,
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
          unitPrice: 100,
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
        unitPrice: number;
      }>;
    } | null>();

    assert.ok(secondCartSnapshot);
    const secondFingerprint = createCheckoutGroupFingerprint({
      pharmacyId: first.pharmacyId.toString(),
      items: secondCartSnapshot.items.map((item) => ({
        id: item._id,
        productOfferId: item.productOfferId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
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
