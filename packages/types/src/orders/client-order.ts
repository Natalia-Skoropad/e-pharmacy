import type { CompletePharmacyBankDetails } from '../pharmacies';
import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategory } from '../products';
import type { Delivery } from './delivery';

import type {
  Currency,
  OrderActivityType,
  OrderStatus,
  PaymentMethod,
} from './status';

//=============================================================================

export type OrderStatusHistoryItem = {
  status: OrderStatus;
  changedAt: ISODateTimeString;
  changedBy: EntityId;
  comment?: string;
};

//=============================================================================

export type OrderActivityHistoryItem = {
  type: OrderActivityType;
  occurredAt: ISODateTimeString;
  changedBy: EntityId;
  productId: EntityId;
  productOfferId: EntityId;
  productName: string;
  previousQuantity: number;
  quantity: number;
  quantityDelta: number;
  previousUnitPrice: number;
  unitPrice: number;
};

//=============================================================================

export type OrderManagerComment = {
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;
  createdBy: EntityId;
};

//=============================================================================

type OrderItem = {
  id: EntityId;
  productId: EntityId;
  productOfferId: EntityId;
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
};

//=============================================================================

export type Order = {
  id: EntityId;
  orderNumber: string;
  createdAt: ISODateTimeString;
  userId?: EntityId;
  clientId?: EntityId;
  clientName?: string;
  clientPhotoUrl?: string;

  client?: {
    id: EntityId;
    name: string;
    photoUrl?: string;
  };

  pharmacyId: EntityId;
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
  statusHistory: OrderStatusHistoryItem[];
  activityHistory: OrderActivityHistoryItem[];
  rejectionReason?: string;
  rejectedAt?: ISODateTimeString;
  rejectedBy?: EntityId;
  paymentMethod: PaymentMethod;
  delivery: Delivery;
  comment?: string;
  bankDetails?: CompletePharmacyBankDetails;
  managerComments?: OrderManagerComment[];
  items: OrderItem[];
};
