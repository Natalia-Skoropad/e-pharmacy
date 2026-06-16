import type { EntityId, ISODateString } from '../shared';
import type { Product } from '../products';

//===================================================================

export type CartProduct = Omit<
  Product,
  'rating' | 'reviewsCount' | 'isFavorite' | 'updatedAt'
> & {
  rating?: number;
  reviewsCount?: number;
};

//===================================================================

export type CartItem = {
  id: EntityId;
  productOfferId: EntityId;
  productId: EntityId;
  pharmacyId: EntityId;
  product: CartProduct;
  pharmacyName: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expiresAt: ISODateString;
};

//===================================================================

export type Cart = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};

export type CartResponse = { cart: Cart };

//===================================================================

export type AddCartItemPayload = {
  productId: EntityId;
  pharmacyId: EntityId;
  quantity: number;
};

export type UpdateCartItemPayload = { quantity: number };
