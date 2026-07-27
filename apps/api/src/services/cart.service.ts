import mongoose, { Types } from 'mongoose';

import {
  CART_ITEM_TTL_DAYS,
  CART_PHARMACY_LIMIT_ERROR_CODE,
  MAX_PHARMACY_GROUPS_PER_CART,
} from '../constants/cart';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';

import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { Pharmacy } from '../models/pharmacy.model';

import { httpError } from '../utils/httpError';
import type { CartProductResponseDto, CartResponseDto } from '../types/cart';
import type { ProductEntity } from '../types/product';

//===============================================================

type CartItemDocument = {
  _id: Types.ObjectId;
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  expiresAt: Date;
};

type CartDocument = {
  _id: Types.ObjectId;
  clientUserId: Types.ObjectId;
  items: CartItemDocument[];
  updatedAt: Date;
};

type ProductDocument = ProductEntity & { _id: Types.ObjectId };

//===============================================================

function getCartItemExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CART_ITEM_TTL_DAYS);
  return expiresAt;
}

//===============================================================

const CART_CLEANUP_THROTTLE_MS = 60_000;
let lastCartCleanupAt = 0;
let cartCleanupPromise: Promise<number> | null = null;

//===============================================================

async function replaceCartItemsOrThrow(
  cart: CartDocument,
  items: CartItemDocument[],
  session: mongoose.ClientSession
): Promise<void> {
  const result = await Cart.updateOne(
    { _id: cart._id, updatedAt: cart.updatedAt },
    { $set: { items } },
    { session, runValidators: true }
  );

  if (result.matchedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Cart was changed by another request. Please refresh and try again.'
    );
  }
}

//===============================================================

async function findOfferOrThrow(productId: string, pharmacyId: string) {
  const [product, offer] = await Promise.all([
    Product.findOne({
      _id: productId,
      status: 'active',
    }).lean<ProductDocument | null>(),
    ProductOffer.findOne({ productId, pharmacyId }).lean(),
  ]);

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }
  if (!offer || offer.availableQuantity <= 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Product is unavailable in this pharmacy'
    );
  }

  return { product, offer };
}

//===============================================================

async function getCartDocument(
  clientUserId: string,
  session?: mongoose.ClientSession
): Promise<CartDocument> {
  const cart = await Cart.findOneAndUpdate(
    { clientUserId },
    { $setOnInsert: { clientUserId, items: [] } },
    { returnDocument: 'after', upsert: true }
  )
    .session(session ?? null)
    .lean<CartDocument | null>();

  if (!cart) {
    throw httpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Cart was not created');
  }

  return cart;
}

//===============================================================

async function serializeCart(cart: CartDocument): Promise<CartResponseDto> {
  const offerIds = cart.items.map((item) => item.productOfferId);
  const offers = await ProductOffer.find({ _id: { $in: offerIds } }).lean();
  const offerMap = new Map(offers.map((offer) => [String(offer._id), offer]));

  const productIds = offers.map((offer) => offer.productId);
  const pharmacyIds = offers.map((offer) => offer.pharmacyId);
  const [products, pharmacies] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).lean<ProductDocument[]>(),
    Pharmacy.find({ _id: { $in: pharmacyIds } }).lean(),
  ]);

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );
  const pharmacyMap = new Map(
    pharmacies.map((pharmacy) => [String(pharmacy._id), pharmacy])
  );
  const items = cart.items
    .map((item) => {
      const offer = offerMap.get(String(item.productOfferId));
      if (!offer) return null;
      const product = productMap.get(String(offer.productId));
      const pharmacy = pharmacyMap.get(String(offer.pharmacyId));
      if (!product || !pharmacy) return null;

      // Cart prices remain live. The confirmed Order stores the immutable price snapshot.
      const unitPrice = offer.price;
      const productDto: CartProductResponseDto = {
        id: String(product._id),
        name: product.name,
        article: product.article,
        category: product.category,
        price: unitPrice,
        ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
        pharmacyName: pharmacy.name,
        inStock: offer.availableQuantity > 0,
        ...(typeof product.rating === 'number'
          ? { rating: product.rating }
          : {}),
        ...(typeof product.reviewsCount === 'number'
          ? { reviewsCount: product.reviewsCount }
          : {}),
      };

      return {
        id: String(item._id),
        productOfferId: String(offer._id),
        productId: String(offer.productId),
        pharmacyId: String(offer.pharmacyId),
        product: productDto,
        pharmacyName: pharmacy.name,
        ...(typeof pharmacy.rating === 'number'
          ? { pharmacyRating: pharmacy.rating }
          : {}),
        ...(typeof pharmacy.reviewsCount === 'number'
          ? { pharmacyReviewsCount: pharmacy.reviewsCount }
          : {}),
        stockQuantity: offer.availableQuantity,
        quantity: item.quantity,
        unitPrice,
        totalPrice: item.quantity * unitPrice,
        expiresAt: item.expiresAt.toISOString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
  };
}

//===============================================================

export async function releaseExpiredCartReservationsService(): Promise<number> {
  const carts = await Cart.find({
    'items.expiresAt': { $lte: new Date() },
  }).lean<CartDocument[]>();
  let releasedItems = 0;

  for (const cart of carts) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const current = await Cart.findById(cart._id)
          .session(session)
          .lean<CartDocument | null>();
        if (!current) return;
        const now = Date.now();
        const expired = current.items.filter(
          (item) => item.expiresAt.getTime() <= now
        );
        if (!expired.length) return;

        void expired;

        await replaceCartItemsOrThrow(
          current,
          current.items.filter((item) => item.expiresAt.getTime() > now),
          session
        );
        releasedItems += expired.length;
      });
    } finally {
      await session.endSession();
    }
  }

  return releasedItems;
}

//===============================================================

async function releaseExpiredCartReservationsIfDue(): Promise<void> {
  const now = Date.now();

  if (cartCleanupPromise) {
    await cartCleanupPromise.catch(() => 0);
    return;
  }

  if (now - lastCartCleanupAt < CART_CLEANUP_THROTTLE_MS) return;

  lastCartCleanupAt = now;
  cartCleanupPromise = releaseExpiredCartReservationsService().finally(() => {
    cartCleanupPromise = null;
  });

  await cartCleanupPromise.catch(() => 0);
}

//===============================================================

export async function getCartService(clientUserId: string) {
  await releaseExpiredCartReservationsIfDue();
  return { cart: await serializeCart(await getCartDocument(clientUserId)) };
}

//===============================================================

export async function addCartItemService(
  clientUserId: string,
  input: { productId: string; pharmacyId: string; quantity: number }
) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);
      const { offer } = await findOfferOrThrow(
        input.productId,
        input.pharmacyId
      );
      const itemIndex = cart.items.findIndex(
        (item) => item.productOfferId.toString() === String(offer._id)
      );
      const currentQuantity =
        itemIndex >= 0 ? cart.items[itemIndex].quantity : 0;
      const quantityToAdd = Math.min(input.quantity, offer.availableQuantity);
      if (
        quantityToAdd < 1 ||
        currentQuantity + quantityToAdd > offer.availableQuantity
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product quantity is no longer available.'
        );
      }

      if (itemIndex < 0) {
        const existingOffers = await ProductOffer.find({
          _id: { $in: cart.items.map((item) => item.productOfferId) },
        })
          .session(session)
          .lean();
        const pharmacyGroups = new Set(
          existingOffers.map((item) => String(item.pharmacyId))
        );
        if (
          !pharmacyGroups.has(input.pharmacyId) &&
          pharmacyGroups.size >= MAX_PHARMACY_GROUPS_PER_CART
        ) {
          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            `The cart can contain products from no more than ${MAX_PHARMACY_GROUPS_PER_CART} pharmacies. Confirm existing orders before adding products from another pharmacy.`,
            undefined,
            CART_PHARMACY_LIMIT_ERROR_CODE
          );
        }
      }

      if (itemIndex >= 0) {
        const currentItem = cart.items[itemIndex];
        cart.items[itemIndex] = {
          ...currentItem,
          quantity: currentItem.quantity + quantityToAdd,
          unitPrice: offer.price,
          expiresAt: getCartItemExpiresAt(),
        };
      } else {
        cart.items.push({
          _id: new Types.ObjectId(),
          productOfferId: offer._id,
          quantity: quantityToAdd,
          unitPrice: offer.price,
          expiresAt: getCartItemExpiresAt(),
        });
      }

      await replaceCartItemsOrThrow(cart, cart.items, session);
    });
    return getCartService(clientUserId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function updateCartItemService(
  clientUserId: string,
  cartItemId: string,
  quantity: number
) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);
      const itemIndex = cart.items.findIndex(
        (item) => item._id.toString() === cartItemId
      );
      if (itemIndex < 0)
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Cart item not found');
      const currentItem = cart.items[itemIndex];
      const offer = await ProductOffer.findById(currentItem.productOfferId)
        .session(session)
        .lean();
      if (!offer)
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Product offer is unavailable'
        );

      const nextQuantity = Math.max(1, quantity);
      if (nextQuantity > offer.availableQuantity) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product quantity is no longer available.'
        );
      }

      cart.items[itemIndex] = {
        ...currentItem,
        quantity: nextQuantity,
        unitPrice: offer.price,
        expiresAt: getCartItemExpiresAt(),
      };
      await replaceCartItemsOrThrow(cart, cart.items, session);
    });
    return getCartService(clientUserId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function removeCartItemService(
  clientUserId: string,
  cartItemId: string
) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);
      const removed = cart.items.find(
        (item) => item._id.toString() === cartItemId
      );
      if (!removed)
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Cart item not found');
      void removed;
      await replaceCartItemsOrThrow(
        cart,
        cart.items.filter((item) => item._id.toString() !== cartItemId),
        session
      );
    });

    return getCartService(clientUserId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function removeCartProductOfferService(
  clientUserId: string,
  productId: string,
  pharmacyId: string
) {
  const offer = await ProductOffer.findOne({ productId, pharmacyId }).lean();
  if (!offer) return getCartService(clientUserId);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);

      const removed = cart.items.filter(
        (item) => item.productOfferId.toString() === String(offer._id)
      );

      void removed;

      await replaceCartItemsOrThrow(
        cart,
        cart.items.filter(
          (item) => item.productOfferId.toString() !== String(offer._id)
        ),
        session
      );
    });

    return getCartService(clientUserId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function clearCartService(clientUserId: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);
      await replaceCartItemsOrThrow(cart, [], session);
    });

    return getCartService(clientUserId);
  } finally {
    await session.endSession();
  }
}
