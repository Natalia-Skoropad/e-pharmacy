import type { CompletePharmacyBankDetails } from '../pharmacies';
import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategory } from '../products';
import type { Delivery } from './delivery';

import type {
  Currency,
  OrderActivityType,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from './status';

//=============================================================================

export type ClientOrderStatusHistoryItem = Readonly<{
  status: OrderStatus;
  changedAt: ISODateTimeString;
  changedBy: EntityId;
  comment?: string;
}>;

//=============================================================================

export type ClientOrderActivityHistoryItem = Readonly<{
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
}>;

//=============================================================================

export type OrderManagerCommentResponseDto = Readonly<{
  id: EntityId;
  text: string;
  createdAt: ISODateTimeString;
  createdBy: EntityId;
}>;

//=============================================================================

export type ClientOrderItem = Readonly<{
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
  availableQuantity?: number;
  currentPrice?: number;
}>;

//=============================================================================

export type ClientOrder = Readonly<{
  id: EntityId;
  orderNumber: string;
  createdAt: ISODateTimeString;
  userId?: EntityId;
  clientId?: EntityId;
  clientName?: string;
  clientPhotoUrl?: string;
  clientPhone?: string;
  clientAddress?: string;

  client?: Readonly<{
    id: EntityId;
    name: string;
    photoUrl?: string;
  }>;

  pharmacyId: EntityId;
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
  statusHistory: readonly ClientOrderStatusHistoryItem[];
  activityHistory: readonly ClientOrderActivityHistoryItem[];
  rejectionReason?: string;
  rejectedAt?: ISODateTimeString;
  rejectedBy?: EntityId;
  paymentMethod: PaymentMethod;
  delivery: Delivery;
  comment?: string;
  managerComment?: string;
  managerCommentsCount: number;
  bankDetails?: CompletePharmacyBankDetails;
  managerComments?: readonly OrderManagerCommentResponseDto[];
  items: readonly ClientOrderItem[];
}>;
