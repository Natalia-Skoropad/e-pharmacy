import type { Types } from 'mongoose';
import type { CompletePharmacyBankDetails } from './pharmacy';
import type { ProductCategory } from './categories';
import type { CalendarDateString, ISODateTimeString } from './date';

//===============================================================

export type OrderStatus = 'new' | 'in_progress' | 'successful' | 'rejected';
export type PaymentMethod = 'cash' | 'bank_transfer';
export type DeliveryMethod = 'pickup' | 'postal_delivery';
export type Currency = '₴';
export type OrderCreatedByType = 'client' | 'manager';

//===============================================================

export type OrderActivityType =
  | 'product_added'
  | 'product_removed'
  | 'quantity_increased'
  | 'quantity_decreased';

//===============================================================

export type OrderPharmacySnapshot = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  bankDetails?: CompletePharmacyBankDetails;
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

export type OrderActivityHistoryItem = {
  type: OrderActivityType;
  occurredAt: Date;
  changedBy: Types.ObjectId;
  productId: Types.ObjectId;
  productOfferId: Types.ObjectId;
  productName: string;
  previousQuantity: number;
  quantity: number;
  quantityDelta: number;
  previousUnitPrice: number;
  unitPrice: number;
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
  createdByType: OrderCreatedByType;
  statusHistory: OrderStatusHistoryItem[];
  activityHistory?: OrderActivityHistoryItem[];
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
  createdAt: ISODateTimeString;
  userId?: string;
  clientId?: string;
  clientName?: string;
  clientPhotoUrl?: string;
  clientPhone?: string;
  clientAddress?: string;

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
  pharmacyWorkingHours?: string;
  totalItems: number;
  totalPrice: number;
  currency: Currency;
  status: OrderStatus;
  createdByType: OrderCreatedByType;

  statusHistory: Array<{
    status: OrderStatus;
    changedAt: ISODateTimeString;
    changedBy: string;
    comment?: string;
  }>;

  activityHistory: Array<{
    type: OrderActivityType;
    occurredAt: ISODateTimeString;
    changedBy: string;
    productId: string;
    productOfferId: string;
    productName: string;
    previousQuantity: number;
    quantity: number;
    quantityDelta: number;
    previousUnitPrice: number;
    unitPrice: number;
  }>;

  rejectionReason?: string;
  rejectedAt?: ISODateTimeString;
  rejectedBy?: string;
  paymentMethod: PaymentMethod;
  delivery: Delivery;
  comment?: string;
  managerComment?: string;
  managerCommentsCount: number;

  managerComments?: Array<{
    id: string;
    text: string;
    createdAt: ISODateTimeString;
    createdBy: string;
  }>;

  bankDetails?: CompletePharmacyBankDetails;
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
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  statistics: OrderStatisticsDto;
  earliestCreatedAt: CalendarDateString | null;
};
