import type { EntityId, ISODateString } from '../shared';
import type { PharmacyBankDetails } from '../pharmacies';

//=============================================================================

export type OrderStatus = 'new' | 'in_progress' | 'successful' | 'rejected';
export type PaymentMethod = 'cash' | 'bank-transfer';
export type DeliveryMethod = 'pickup' | 'post';

//=============================================================================

export type OrderDeliveryDetails = {
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
};

export type OrderItem = {
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

export type Order = {
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
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
  bankDetails?: PharmacyBankDetails;
  items: OrderItem[];
};

export type OrdersResponse = {
  items: Order[];
  total: number;
};

export type CheckoutOrderPayload = {
  pharmacyId: EntityId;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  deliveryDetails?: OrderDeliveryDetails;
  comment?: string;
};

export type CheckoutOrderResponse = {
  order: Order;
};

export type OrderDetailsResponse = {
  order: Order;
};
