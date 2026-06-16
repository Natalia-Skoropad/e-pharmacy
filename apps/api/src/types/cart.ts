import type { Types } from 'mongoose';
import type { ProductResponseDto } from './product';

//===============================================================

export type CartItemEntity = {
  productOfferId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CartEntity = {
  clientUserId: Types.ObjectId;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;
};

export type CartItemResponseDto = {
  id: string;
  productOfferId: string;
  productId: string;
  pharmacyId: string;
  product: ProductResponseDto;
  pharmacyName: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expiresAt: string;
};

export type CartResponseDto = {
  items: CartItemResponseDto[];
  totalItems: number;
  totalPrice: number;
};
