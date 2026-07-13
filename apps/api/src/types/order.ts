import type { Types } from 'mongoose';
import type { PharmacyBankDetails } from './pharmacy';
import type { ProductCategory } from './categories';

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
  category?: ProductCategory;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  rating?: number;
  reviewsCount?: number;
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

//===============================================================

export type OrderStatusHistoryItem = {
  status: OrderStatus;
  changedAt: Date;
  changedBy: Types.ObjectId;
  comment?: string;
};

export type OrderManagerCommentEntity = {
  _id?: Types.ObjectId;
  text: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
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
  managerComment?: string;
  managerComments?: OrderManagerCommentEntity[];
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
  category?: ProductCategory;
  imageUrl?: string;
  manufacturer?: string;
  dosage?: string;
  packageQuantity?: string;
  rating?: number;
  reviewsCount?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableQuantity?: number;
  currentPrice?: number;
};

export type OrderResponseDto = {
  id: string;
  orderNumber: string;
  createdAt: string;
  userId?: string;
  clientId?: string;
  clientName?: string;
  clientPhotoUrl?: string;
  client?: {
    id: string;
    name: string;
    photoUrl?: string;
  };
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
  managerComment?: string;
  managerComments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdBy: string;
  }>;
  bankDetails?: PharmacyBankDetails;
  items: OrderItemResponseDto[];
};

//===============================================================

export type OrderSalesStatisticsGroupBy = 'day' | 'month';

//===============================================================

export type OrderSalesStatisticsValueDto = { quantity: number; amount: number };

export type OrderSalesStatisticsPointDto = {
  key: string;
  label: string;
  values: Partial<Record<ProductCategory, OrderSalesStatisticsValueDto>>;
};

export type OrderSalesStatisticsDto = {
  currency: Currency;
  groupBy: OrderSalesStatisticsGroupBy;
  categories: ProductCategory[];
  points: OrderSalesStatisticsPointDto[];
};

export type OrderStatisticsValueDto = { count: number; amount: number };

export type OrderStatisticsDto = Record<OrderStatus, OrderStatisticsValueDto>;

export type OrdersResponseDto = {
  items: OrderResponseDto[];
  total: number;
  statistics: OrderStatisticsDto;
};
