import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { httpError } from '../utils/httpError';

import type { CartResponseDto } from '../types/cart';
import type { ProductEntity, ProductOfferEntity } from '../types/product';

//===============================================================

const CART_ITEM_TTL_DAYS = 3;

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

async function getCartDocument(userId: string): Promise<CartDocument> {
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { new: true, upsert: true }
  ).lean<CartDocument | null>();

  if (!cart) {
    throw httpError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Cart was not created');
  }

  const activeItems = removeExpiredItems(cart.items ?? []);

  if (activeItems.length !== cart.items.length) {
    await Cart.updateOne({ userId }, { $set: { items: activeItems } });

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
        stockQuantity: offer.activeQuantity,
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
  const cart = await getCartDocument(userId);
  const { offer } = await getProductOfferOrThrow(
    input.productId,
    input.storeId
  );

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.productId.toString() === input.productId &&
      item.storeId.toString() === input.storeId
  );

  if (itemIndex >= 0) {
    const currentItem = cart.items[itemIndex];

    const nextQuantity = Math.min(
      currentItem.quantity + input.quantity,
      offer.activeQuantity
    );

    cart.items[itemIndex] = {
      ...currentItem,
      quantity: nextQuantity,
      price: offer.price,
      expiresAt: getCartItemExpiresAt(),
    };
  } else {
    cart.items.push({
      _id: new Types.ObjectId(),
      productId: new Types.ObjectId(input.productId),
      storeId: new Types.ObjectId(input.storeId),
      quantity: Math.min(input.quantity, offer.activeQuantity),
      price: offer.price,
      expiresAt: getCartItemExpiresAt(),
    });
  }

  await Cart.updateOne({ userId }, { $set: { items: cart.items } });

  return getCartService(userId);
}

//===============================================================

export async function updateCartItemService(
  userId: string,
  cartItemId: string,
  quantity: number
) {
  const cart = await getCartDocument(userId);

  const itemIndex = cart.items.findIndex(
    (cartItem) => cartItem._id.toString() === cartItemId
  );

  if (itemIndex < 0) {
    throw httpError(HTTP_STATUS.NOT_FOUND, 'Cart item not found');
  }

  const currentItem = cart.items[itemIndex];

  const { offer } = await getProductOfferOrThrow(
    currentItem.productId.toString(),
    currentItem.storeId.toString()
  );

  cart.items[itemIndex] = {
    ...currentItem,
    quantity: Math.min(quantity, offer.activeQuantity),
    price: offer.price,
    expiresAt: getCartItemExpiresAt(),
  };

  await Cart.updateOne({ userId }, { $set: { items: cart.items } });

  return getCartService(userId);
}

//===============================================================

export async function removeCartItemService(
  userId: string,
  cartItemId: string
) {
  const cart = await getCartDocument(userId);

  const items = cart.items.filter((item) => item._id.toString() !== cartItemId);

  await Cart.updateOne({ userId }, { $set: { items } });

  return getCartService(userId);
}

//===============================================================

export async function removeCartProductOfferService(
  userId: string,
  productId: string,
  storeId: string
) {
  const cart = await getCartDocument(userId);

  const items = cart.items.filter(
    (item) =>
      item.productId.toString() !== productId ||
      item.storeId.toString() !== storeId
  );

  await Cart.updateOne({ userId }, { $set: { items } });

  return getCartService(userId);
}

//===============================================================

export async function clearCartService(userId: string) {
  await Cart.updateOne({ userId }, { $set: { items: [] } }, { upsert: true });

  return getCartService(userId);
}
