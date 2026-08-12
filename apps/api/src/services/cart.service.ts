import mongoose, { Types } from 'mongoose';

import {
  CART_CHANGED_ERROR_CODE,
  CART_ITEM_MAX_QUANTITY,
  CART_ITEM_TTL_DAYS,
  CART_PHARMACY_LIMIT_ERROR_CODE,
  MAX_PHARMACY_GROUPS_PER_CART,
} from '../constants/cart';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { STOCK_CHANGED_ERROR_CODE } from '../constants/stock';

import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { ProductOffer } from '../models/productOffer.model';
import { Pharmacy } from '../models/pharmacy.model';

import { httpError } from '../utils/httpError';
import { getCartItemUnavailableReason } from './cart-item-availability';

import type {
  CartIssueResponseDto,
  CartProductResponseDto,
  CartResponseDto,
} from '../types/cart';

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
  revision: number;
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

async function replaceCartItemsOrThrow(
  cart: CartDocument,
  items: CartItemDocument[],
  session: mongoose.ClientSession
): Promise<number> {
  const result = await Cart.updateOne(
    { _id: cart._id, revision: cart.revision },
    { $set: { items }, $inc: { revision: 1 } },
    { session, runValidators: true }
  );

  if (result.matchedCount !== 1) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'Cart was changed by another request. Please refresh and try again.',
      undefined,
      CART_CHANGED_ERROR_CODE
    );
  }

  return cart.revision + 1;
}

//===============================================================

async function findOfferOrThrow(
  productId: string,
  pharmacyId: string,
  session?: mongoose.ClientSession
) {
  const [product, offer] = await Promise.all([
    Product.findOne({
      _id: productId,
      status: 'active',
    })
      .session(session ?? null)
      .lean<ProductDocument | null>(),

    ProductOffer.findOne({ productId, pharmacyId })
      .session(session ?? null)
      .lean(),
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

async function ensureCartRevision(
  cart: CartDocument,
  session?: mongoose.ClientSession
): Promise<CartDocument> {
  if (Number.isSafeInteger(cart.revision) && cart.revision >= 0) return cart;

  const result = await Cart.updateOne(
    { _id: cart._id, revision: { $exists: false } },
    { $set: { revision: 0 } },
    { session }
  );

  if (result.matchedCount !== 1) {
    const refreshed = await Cart.findById(cart._id)
      .session(session ?? null)
      .lean<CartDocument | null>();

    if (!refreshed || !Number.isSafeInteger(refreshed.revision)) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Cart revision could not be initialized. Please refresh and try again.'
      );
    }

    return refreshed;
  }

  return { ...cart, revision: 0 };
}

//===============================================================

async function getCartDocument(
  clientUserId: string,
  session?: mongoose.ClientSession
): Promise<CartDocument> {
  const cart = await Cart.findOneAndUpdate(
    { clientUserId },
    { $setOnInsert: { clientUserId, items: [], revision: 0 } },
    { returnDocument: 'after', upsert: true }
  )
    .session(session ?? null)
    .lean<CartDocument | null>();

  if (!cart) {
    throw httpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Cart was not created');
  }

  return ensureCartRevision(cart, session);
}

//===============================================================

async function serializeCartWithCleanup(
  cart: CartDocument,
  session: mongoose.ClientSession
): Promise<CartResponseDto> {
  const now = Date.now();
  const issues: CartIssueResponseDto[] = [];
  const offerIds = cart.items.map((item) => item.productOfferId);

  const offers = await ProductOffer.find({ _id: { $in: offerIds } })
    .session(session)
    .lean();

  const offerMap = new Map(offers.map((offer) => [String(offer._id), offer]));
  const productIds = offers.map((offer) => offer.productId);
  const pharmacyIds = offers.map((offer) => offer.pharmacyId);

  const [products, pharmacies] = await Promise.all([
    Product.find({ _id: { $in: productIds } })
      .session(session)
      .lean<ProductDocument[]>(),

    Pharmacy.find({ _id: { $in: pharmacyIds } })
      .session(session)
      .lean(),
  ]);

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  const pharmacyMap = new Map(
    pharmacies.map((pharmacy) => [String(pharmacy._id), pharmacy])
  );

  const validItems = cart.items.filter((item) => {
    const offer = offerMap.get(String(item.productOfferId));
    const product = offer ? productMap.get(String(offer.productId)) : undefined;
    const pharmacy = offer
      ? pharmacyMap.get(String(offer.pharmacyId))
      : undefined;
    const reason = getCartItemUnavailableReason({
      isExpired: item.expiresAt.getTime() <= now,
      offerExists: Boolean(offer),
      productStatus: product?.status,
      pharmacyStatus: pharmacy?.status,
    });

    if (!reason) return true;

    issues.push({ cartItemId: item._id.toString(), reason });
    return false;
  });

  let revision = cart.revision;
  if (validItems.length !== cart.items.length) {
    revision = await replaceCartItemsOrThrow(cart, validItems, session);
  }

  const items = validItems.map((item) => {
    const offer = offerMap.get(String(item.productOfferId));
    if (!offer) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Cart references changed while it was being read. Please refresh and try again.'
      );
    }

    const product = productMap.get(String(offer.productId));
    const pharmacy = pharmacyMap.get(String(offer.pharmacyId));

    if (!product || !pharmacy) {
      throw httpError(
        HTTP_STATUS.CONFLICT,
        'Cart references changed while it was being read. Please refresh and try again.'
      );
    }

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
      ...(typeof product.rating === 'number' ? { rating: product.rating } : {}),
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
  });

  return {
    revision,
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
    issues,
  };
}

//===============================================================

export async function cleanupExpiredCartItemsService(): Promise<number> {
  const carts = await Cart.find({
    'items.expiresAt': { $lte: new Date() },
  }).lean<CartDocument[]>();
  let removedItems = 0;

  for (const candidate of carts) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const found = await Cart.findById(candidate._id)
          .session(session)
          .lean<CartDocument | null>();
        if (!found) return;

        const current = await ensureCartRevision(found, session);
        const now = Date.now();
        const nextItems = current.items.filter(
          (item) => item.expiresAt.getTime() > now
        );
        const removedCount = current.items.length - nextItems.length;
        if (removedCount === 0) return;

        await replaceCartItemsOrThrow(current, nextItems, session);
        removedItems += removedCount;
      });
    } finally {
      await session.endSession();
    }
  }

  return removedItems;
}

//===============================================================

export async function getCartService(clientUserId: string) {
  const session = await mongoose.startSession();
  try {
    const cartResponse = await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);
      return serializeCartWithCleanup(cart, session);
    });

    if (!cartResponse) {
      throw httpError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Cart could not be serialized'
      );
    }

    return { cart: cartResponse };
  } finally {
    await session.endSession();
  }
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
        input.pharmacyId,
        session
      );
      const itemIndex = cart.items.findIndex(
        (item) => item.productOfferId.toString() === String(offer._id)
      );
      const currentQuantity =
        itemIndex >= 0 ? cart.items[itemIndex].quantity : 0;
      const quantityToAdd = input.quantity;
      const nextQuantity = currentQuantity + quantityToAdd;

      if (nextQuantity > CART_ITEM_MAX_QUANTITY) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          `Cart item quantity cannot exceed ${CART_ITEM_MAX_QUANTITY}.`
        );
      }

      if (
        quantityToAdd < 1 ||
        nextQuantity > offer.availableQuantity
      ) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Available quantity has changed. Refresh the cart and try again.',
          undefined,
          STOCK_CHANGED_ERROR_CODE
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
          'Available quantity has changed. Refresh the cart and try again.',
          undefined,
          STOCK_CHANGED_ERROR_CODE
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
      const exists = cart.items.some(
        (item) => item._id.toString() === cartItemId
      );
      if (!exists)
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Cart item not found');

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

export async function removeCartPharmacyService(
  clientUserId: string,
  pharmacyId: string
) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(clientUserId, session);
      if (cart.items.length === 0) return;

      const offers = await ProductOffer.find({
        _id: { $in: cart.items.map((item) => item.productOfferId) },
        pharmacyId,
      })
        .select('_id')
        .session(session)
        .lean();

      const offerIds = new Set(offers.map((offer) => String(offer._id)));
      if (offerIds.size === 0) return;

      const nextItems = cart.items.filter(
        (item) => !offerIds.has(String(item.productOfferId))
      );

      if (nextItems.length === cart.items.length) return;
      await replaceCartItemsOrThrow(cart, nextItems, session);
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
      const nextItems = cart.items.filter(
        (item) => item.productOfferId.toString() !== String(offer._id)
      );

      if (nextItems.length === cart.items.length) return;
      await replaceCartItemsOrThrow(cart, nextItems, session);
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
      if (cart.items.length === 0) return;
      await replaceCartItemsOrThrow(cart, [], session);
    });

    return getCartService(clientUserId);
  } finally {
    await session.endSession();
  }
}
