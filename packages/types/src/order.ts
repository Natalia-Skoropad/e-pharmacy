import type { EntityId, ISODateString } from './base';
import type { StoreBankDetails } from './store';

//=============================================================================

export type OrderStatus = 'accepted' | 'processing' | 'completed' | 'cancelled';
export type OrderPaymentMethod = 'cash' | 'bank-transfer';
export type OrderDeliveryMethod = 'pickup' | 'post';

//=============================================================================

export type OrderDeliveryDetails = {
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
};

export type OrderItemDto = {
  id: EntityId;
  productId: EntityId;
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

export type OrderDto = {
  id: EntityId;
  orderNumber: string;
  createdAt: ISODateString;
  storeId: EntityId;
  storeName: string;
  storeRating?: number;
  storeReviewsCount?: number;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  totalItems: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
  bankDetails?: StoreBankDetails;
  items: OrderItemDto[];
};

export type OrdersResponse = {
  items: OrderDto[];
  total: number;
};

export type CheckoutOrderPayload = {
  storeId: EntityId;
  paymentMethod: OrderPaymentMethod;
  deliveryMethod: OrderDeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
};

export type CheckoutOrderResponse = {
  order: OrderDto;
};

export type OrderDetailsResponse = {
  order: OrderDto;
};
