import type { EntityId, ISODateString } from '../shared';
import type { PharmacyBankDetails } from '../pharmacies';

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
  pharmacyId: EntityId;
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
  items: OrderItemDto[];
};

export type OrdersResponse = {
  items: OrderDto[];
  total: number;
};

export type CheckoutOrderPayload = {
  pharmacyId: EntityId;
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

export type ClientOrder = OrderDto;
