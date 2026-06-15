import type { Types } from 'mongoose';

import type { PharmacyBankDetails } from './pharmacy';

//===============================================================

export type OrderStatus = 'accepted' | 'processing' | 'completed' | 'cancelled';
export type OrderPaymentMethod = 'cash' | 'bank-transfer';
export type OrderDeliveryMethod = 'pickup' | 'post';

//===============================================================

export type OrderPharmacySnapshot = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  bankDetails?: PharmacyBankDetails;
};

export type OrderProductSnapshot = {
  name: string;
  slug?: string;
  article: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
};

export type OrderDeliveryDetails = {
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
};

export type OrderItemEntity = {
  productId: Types.ObjectId;
  productSnapshot: OrderProductSnapshot;
  quantity: number;
  price: number;
  totalPrice: number;
};

export type OrderEntity = {
  userId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  pharmacySnapshot: OrderPharmacySnapshot;
  items: OrderItemEntity[];
  totalItems: number;
  totalPrice: number;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
  status: OrderStatus;
  orderNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type OrderItemResponseDto = {
  id: string;
  productId: string;
  name: string;
  slug?: string;
  article: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  quantity: number;
  price: number;
  totalPrice: number;
};

export type OrderResponseDto = {
  id: string;
  orderNumber: string;
  createdAt: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  pharmacyPhone?: string;
  pharmacyEmail?: string;
  pharmacyAddress?: string;
  totalItems: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
  bankDetails?: PharmacyBankDetails;
  items: OrderItemResponseDto[];
};

export type OrdersResponseDto = {
  items: OrderResponseDto[];
  total: number;
};
