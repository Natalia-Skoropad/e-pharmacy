import type { EntityId, ISODateString } from './base';
import type { ProductDto } from './product';

//=============================================================================

export type CartItemDto = {
  id: EntityId;
  productId: EntityId;
  storeId: EntityId;
  product: ProductDto;
  storeName: string;
  storeRating?: number;
  storeReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  price: number;
  totalPrice: number;
  expiresAt: ISODateString;
};

export type CartDto = {
  items: CartItemDto[];
  totalItems: number;
  totalPrice: number;
};

export type CartResponse = {
  cart: CartDto;
};

export type AddCartItemPayload = {
  productId: EntityId;
  storeId: EntityId;
  quantity: number;
};

export type UpdateCartItemPayload = {
  quantity: number;
};
