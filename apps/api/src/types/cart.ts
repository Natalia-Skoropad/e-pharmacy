import type { Types } from 'mongoose';

import type { ProductResponseDto } from './product';

//===============================================================

export type CartItemEntity = {
  productId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  quantity: number;
  price: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type CartEntity = {
  userId: Types.ObjectId;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type CartItemResponseDto = {
  id: string;
  productId: string;
  pharmacyId: string;
  product: ProductResponseDto;
  pharmacyName: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  price: number;
  totalPrice: number;
  expiresAt: string;
};

//===============================================================

export type CartResponseDto = {
  items: CartItemResponseDto[];
  totalItems: number;
  totalPrice: number;
};
