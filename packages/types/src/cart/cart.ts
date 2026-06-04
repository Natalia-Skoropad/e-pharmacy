import type { EntityId, ISODateString } from '../shared';
import type { ProductDto } from '../products';

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

export type Cart = CartDto;
export type CartItem = CartItemDto;
export type CartSummary = Pick<CartDto, 'totalItems' | 'totalPrice'>;
