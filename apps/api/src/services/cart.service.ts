import mongoose, { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { httpError } from '../utils/httpError';
import { releaseOfferStock, reserveOfferStock } from './inventory.service';

import type { CartResponseDto } from '../types/cart';
import type { ProductEntity, ProductOfferEntity } from '../types/product';

//===============================================================

const CART_ITEM_TTL_DAYS = 3;
const MAX_CART_INVOICES = 15;

//===============================================================

type CartItemDocument = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  storeId: Types.ObjectId;
  quantity: number;
  price: number;
  expiresAt: Date;
};

type CartDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDocument[];
};

type ProductDocument = ProductEntity & {
  _id: Types.ObjectId;
};

//===============================================================

function getCartItemExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CART_ITEM_TTL_DAYS);

  return expiresAt;
}

//===============================================================

function removeExpiredItems<TItem extends { expiresAt: Date }>(items: TItem[]) {
  const now = Date.now();

  return items.filter((item) => item.expiresAt.getTime() > now);
}

//===============================================================

function findProductOffer(
  product: ProductDocument,
  storeId: string
): ProductOfferEntity | null {
  return (
    product.offers?.find((offer) => offer.storeId.toString() === storeId) ??
    null
  );
}

//===============================================================

async function getProductOfferOrThrow(productId: string, storeId: string) {
  const product = await Product.findById(
    productId
  ).lean<ProductDocument | null>();

  if (!product) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
  }

  const offer = findProductOffer(product, storeId);

  if (!offer || !offer.inStock || offer.activeQuantity <= 0) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Product is unavailable in this pharmacy'
    );
  }

  return { product, offer };
}

//===============================================================

async function getCartDocument(
  userId: string,
  session?: mongoose.ClientSession
): Promise<CartDocument> {
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { new: true, upsert: true }
  )
    .session(session ?? null)
    .lean<CartDocument | null>();

  if (!cart) {
    throw httpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Cart was not created');
  }

  const activeItems = removeExpiredItems(cart.items ?? []);

  if (activeItems.length !== cart.items.length) {
    const expiredItems = cart.items.filter(
      (item) => item.expiresAt.getTime() <= Date.now()
    );

    for (const item of expiredItems) {
      await releaseOfferStock(
        item.productId,
        item.storeId,
        item.quantity,
        session,
        false
      );
    }

    await Cart.updateOne(
      { userId },
      { $set: { items: activeItems } },
      { session }
    );

    return {
      ...cart,
      items: activeItems,
    };
  }

  return cart;
}

//===============================================================

async function serializeCart(cart: CartDocument): Promise<CartResponseDto> {
  const productIds = cart.items.map((item) => item.productId);

  const products = await Product.find({
    _id: { $in: productIds },
  }).lean<ProductDocument[]>();

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const items = cart.items
    .map((item) => {
      const product = productMap.get(item.productId.toString());

      if (!product) return null;

      const offer = findProductOffer(product, item.storeId.toString());

      if (!offer) return null;

      const productDto = {
        id: product._id.toString(),
        name: product.name,
        ...(product.slug ? { slug: product.slug } : {}),
        article: product.article,
        ...(product.description ? { description: product.description } : {}),
        category: product.category,
        price: item.price,
        ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
        ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
        ...(product.dosage ? { dosage: product.dosage } : {}),
        ...(product.packageQuantity
          ? { packageQuantity: product.packageQuantity }
          : {}),
        storeId: offer.storeId.toString(),
        storeName: offer.storeName,
        foundInStoresCount: product.offers?.length ?? 1,
        offers: [],
        inStock: offer.inStock,
        ...(typeof product.rating === 'number'
          ? { rating: product.rating }
          : {}),
        ...(typeof product.reviewsCount === 'number'
          ? { reviewsCount: product.reviewsCount }
          : {}),
      };

      return {
        id: item._id.toString(),
        productId: item.productId.toString(),
        storeId: item.storeId.toString(),
        product: productDto,
        storeName: offer.storeName,
        ...(typeof offer.storeRating === 'number'
          ? { storeRating: offer.storeRating }
          : {}),
        ...(typeof offer.storeReviewsCount === 'number'
          ? { storeReviewsCount: offer.storeReviewsCount }
          : {}),
        stockQuantity: offer.activeQuantity + item.quantity,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
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

export async function getCartService(userId: string) {
  const cart = await getCartDocument(userId);

  return {
    cart: await serializeCart(cart),
  };
}

//===============================================================

export async function addCartItemService(
  userId: string,
  input: { productId: string; storeId: string; quantity: number }
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(userId, session);
      const { offer } = await getProductOfferOrThrow(
        input.productId,
        input.storeId
      );

      const itemIndex = cart.items.findIndex(
        (item) =>
          item.productId.toString() === input.productId &&
          item.storeId.toString() === input.storeId
      );

      const quantityToReserve = Math.min(input.quantity, offer.activeQuantity);

      if (quantityToReserve < 1) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'Product quantity is no longer available. Please refresh the cart and try again.'
        );
      }

      await reserveOfferStock(
        input.productId,
        input.storeId,
        quantityToReserve,
        session
      );

      if (itemIndex >= 0) {
        const currentItem = cart.items[itemIndex];

        cart.items[itemIndex] = {
          ...currentItem,
          quantity: currentItem.quantity + quantityToReserve,
          price: offer.price,
          expiresAt: getCartItemExpiresAt(),
        };
      } else {
        const invoiceStoreIds = new Set(
          cart.items.map((item) => item.storeId.toString())
        );

        if (
          !invoiceStoreIds.has(input.storeId) &&
          invoiceStoreIds.size >= MAX_CART_INVOICES
        ) {
          await releaseOfferStock(
            input.productId,
            input.storeId,
            quantityToReserve,
            session
          );

          throw httpError(
            HTTP_STATUS.BAD_REQUEST,
            'You cannot add more than 15 invoices to the cart. Confirm previous invoices to continue shopping.'
          );
        }

        cart.items.push({
          _id: new Types.ObjectId(),
          productId: new Types.ObjectId(input.productId),
          storeId: new Types.ObjectId(input.storeId),
          quantity: quantityToReserve,
          price: offer.price,
          expiresAt: getCartItemExpiresAt(),
        });
      }

      await Cart.updateOne(
        { userId },
        { $set: { items: cart.items } },
        { session }
      );
    });

    return getCartService(userId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function updateCartItemService(
  userId: string,
  cartItemId: string,
  quantity: number
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(userId, session);

      const itemIndex = cart.items.findIndex(
        (cartItem) => cartItem._id.toString() === cartItemId
      );

      if (itemIndex < 0) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Cart item not found');
      }

      const currentItem = cart.items[itemIndex];
      const product = await Product.findById(currentItem.productId)
        .session(session)
        .lean<ProductDocument | null>();

      if (!product) {
        throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PRODUCT_NOT_FOUND);
      }

      const offer = findProductOffer(product, currentItem.storeId.toString());

      if (!offer) {
        throw httpError(
          HTTP_STATUS.BAD_REQUEST,
          'Product is unavailable in this pharmacy'
        );
      }

      const nextQuantity = Math.max(1, quantity);
      const delta = nextQuantity - currentItem.quantity;

      if (delta > 0) {
        const quantityToReserve = Math.min(delta, offer.activeQuantity);

        if (quantityToReserve !== delta) {
          throw httpError(
            HTTP_STATUS.CONFLICT,
            'Requested quantity is no longer available. Please refresh the cart and try again.'
          );
        }

        await reserveOfferStock(
          currentItem.productId,
          currentItem.storeId,
          delta,
          session
        );
      }

      if (delta < 0) {
        await releaseOfferStock(
          currentItem.productId,
          currentItem.storeId,
          Math.abs(delta),
          session
        );
      }

      cart.items[itemIndex] = {
        ...currentItem,
        quantity: nextQuantity,
        price: offer.price,
        expiresAt: getCartItemExpiresAt(),
      };

      await Cart.updateOne(
        { userId },
        { $set: { items: cart.items } },
        { session }
      );
    });

    return getCartService(userId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function removeCartItemService(
  userId: string,
  cartItemId: string
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(userId, session);
      const removedItem = cart.items.find(
        (item) => item._id.toString() === cartItemId
      );

      if (!removedItem) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Cart item not found');
      }

      await releaseOfferStock(
        removedItem.productId,
        removedItem.storeId,
        removedItem.quantity,
        session
      );

      const items = cart.items.filter(
        (item) => item._id.toString() !== cartItemId
      );

      await Cart.updateOne({ userId }, { $set: { items } }, { session });
    });

    return getCartService(userId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function removeCartProductOfferService(
  userId: string,
  productId: string,
  storeId: string
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(userId, session);
      const removedItems = cart.items.filter(
        (item) =>
          item.productId.toString() === productId &&
          item.storeId.toString() === storeId
      );

      for (const item of removedItems) {
        await releaseOfferStock(
          item.productId,
          item.storeId,
          item.quantity,
          session
        );
      }

      const items = cart.items.filter(
        (item) =>
          item.productId.toString() !== productId ||
          item.storeId.toString() !== storeId
      );

      await Cart.updateOne({ userId }, { $set: { items } }, { session });
    });

    return getCartService(userId);
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function clearCartService(userId: string) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cart = await getCartDocument(userId, session);

      for (const item of cart.items) {
        await releaseOfferStock(
          item.productId,
          item.storeId,
          item.quantity,
          session
        );
      }

      await Cart.updateOne(
        { userId },
        { $set: { items: [] } },
        { upsert: true, session }
      );
    });

    return getCartService(userId);
  } finally {
    await session.endSession();
  }
}
