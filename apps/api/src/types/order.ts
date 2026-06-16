import type { Types } from 'mongoose';
import type { PharmacyBankDetails } from './pharmacy';

//===============================================================

export type OrderStatus = 'new' | 'in_progress' | 'successful' | 'rejected';
export type PaymentMethod = 'cash' | 'bank_transfer';
export type DeliveryMethod = 'pickup' | 'postal_delivery';
export type Currency = 'UAH';

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
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
};

//===============================================================

export type Delivery =
  | { method: 'pickup'; details?: never }
  | {
      method: 'postal_delivery';
      details: {
        recipientName: string;
        recipientPhone: string;
        address: string;
      };
    };

export type OrderStatusHistoryItem = {
  status: OrderStatus;
  changedAt: Date;
  changedBy: Types.ObjectId;
  comment?: string;
};

export type OrderItemEntity = {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  productOfferId: Types.ObjectId;
  productSnapshot: OrderProductSnapshot;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderEntity = {
  userId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  pharmacySnapshot: OrderPharmacySnapshot;
  items: OrderItemEntity[];
  totalItems: number;
  totalPrice: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  delivery: Delivery;
  comment?: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  orderNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItemResponseDto = {
  id: string;
  productId: string;
  productOfferId: string;
  name: string;
  slug?: string;
  article: string;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  quantity: number;
  unitPrice: number;
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
  currency: Currency;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: string;
    changedBy: string;
    comment?: string;
  }>;
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  paymentMethod: PaymentMethod;
  delivery: Delivery;
  comment?: string;
  bankDetails?: PharmacyBankDetails;
  items: OrderItemResponseDto[];
};

//===============================================================

export type OrdersResponseDto = { items: OrderResponseDto[]; total: number };
