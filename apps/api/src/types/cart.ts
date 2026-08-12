import type { Types } from 'mongoose';
import type { ProductCategory } from './categories';

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
  revision: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CartProductResponseDto = {
  id: string;
  name: string;
  article: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  pharmacyName?: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
};

//===============================================================

export type CartItemResponseDto = {
  id: string;
  productOfferId: string;
  productId: string;
  pharmacyId: string;
  product: CartProductResponseDto;
  pharmacyName: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expiresAt: string;
};

export type CartIssueReason =
  | 'expired'
  | 'offer_unavailable'
  | 'product_unavailable'
  | 'pharmacy_unavailable';

export type CartIssueResponseDto = {
  cartItemId: string;
  reason: CartIssueReason;
};

export type CartResponseDto = {
  revision: number;
  items: CartItemResponseDto[];
  totalItems: number;
  totalPrice: number;
  issues: CartIssueResponseDto[];
};
