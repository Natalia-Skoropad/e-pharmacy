import type { StoreBankDetails } from './stores';

//===================================================================

export type CustomerOrderStatus =
  | 'accepted'
  | 'processing'
  | 'completed'
  | 'cancelled';
export type CustomerOrderPaymentMethod = 'cash' | 'bank-transfer';
export type CustomerOrderDeliveryMethod = 'pickup' | 'post';

//===================================================================

export type CustomerOrderDeliveryDetails = {
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
};

export type CustomerOrderItem = {
  id: string;
  productId: string;
  name: string;
  slug?: string;
  article?: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  quantity: number;
  price: number;
  totalPrice: number;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  storeId: string;
  storeName: string;
  storeRating?: number;
  storeReviewsCount?: number;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  totalItems: number;
  totalPrice: number;
  status: CustomerOrderStatus;
  paymentMethod: CustomerOrderPaymentMethod;
  deliveryMethod: CustomerOrderDeliveryMethod;
  deliveryDetails?: CustomerOrderDeliveryDetails;
  comment?: string;
  bankDetails?: StoreBankDetails;
  items: CustomerOrderItem[];
};

export type CheckoutOrderPayload = {
  storeId: string;
  paymentMethod: CustomerOrderPaymentMethod;
  deliveryMethod: CustomerOrderDeliveryMethod;
  deliveryDetails?: CustomerOrderDeliveryDetails;
  comment?: string;
};

export type CheckoutOrderResponse = {
  order: CustomerOrder;
};

export type OrderDetailsResponse = {
  order: CustomerOrder;
};

export type OrdersResponse = {
  items: CustomerOrder[];
  total: number;
};
