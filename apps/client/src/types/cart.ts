import type { Product } from './product';

//===================================================================

export type CartItem = {
  id: string;
  productId: string;
  storeId: string;
  product: Product;
  storeName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  expiresAt: string;
};

//===================================================================

export type Cart = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};

//===================================================================

export type CartResponse = {
  cart: Cart;
};

//===================================================================

export type AddCartItemPayload = {
  productId: string;
  storeId: string;
  quantity: number;
};

//===================================================================

export type UpdateCartItemPayload = {
  quantity: number;
};
