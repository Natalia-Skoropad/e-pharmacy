import type { Product } from './products';

//===================================================================

export type CartItem = {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  totalPrice: number;
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
  quantity: number;
};

//===================================================================

export type UpdateCartItemPayload = {
  quantity: number;
};
