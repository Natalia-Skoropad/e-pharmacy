import type { EntityId, ISODateString } from '../shared';
import type { PharmacyBankDetails } from '../pharmacies';
import type { Cart } from '../cart';
import type { ProductCategory } from '../products/categories';

//=============================================================================

export type OrderStatus = 'new' | 'in_progress' | 'successful' | 'rejected';
export type PaymentMethod = 'cash' | 'bank_transfer';
export type DeliveryMethod = 'pickup' | 'postal_delivery';
export type Currency = 'UAH';

//=============================================================================

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

//=============================================================================

export type OrderStatusHistoryItem = {
  status: OrderStatus;
  changedAt: ISODateString;
  changedBy: EntityId;
  comment?: string;
};

export type OrderItem = {
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

export type Order = {
  id: EntityId;
  orderNumber: string;
  createdAt: ISODateString;
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
  rejectionReason?: string;
  rejectedAt?: ISODateString;
  rejectedBy?: EntityId;
  paymentMethod: PaymentMethod;
  delivery: Delivery;
  comment?: string;
  bankDetails?: PharmacyBankDetails;
  items: OrderItem[];
};

//=============================================================================

export type OrdersResponse = { items: Order[]; total: number };

//=============================================================================

export type CheckoutOrderPayload =
  | {
      pharmacyId: EntityId;
      paymentMethod: PaymentMethod;
      deliveryMethod: 'pickup';
      deliveryDetails?: never;
      comment?: string;
    }
  | {
      pharmacyId: EntityId;
      paymentMethod: PaymentMethod;
      deliveryMethod: 'postal_delivery';
      deliveryDetails: {
        recipientName: string;
        recipientPhone: string;
        address: string;
      };
      comment?: string;
    };

//=============================================================================

export type CheckoutOrderResponse = { order: Order; cart: Cart };
export type OrderDetailsResponse = { order: Order };

//=============================================================================

export type UpdateOrderStatusPayload =
  | {
      status: Extract<OrderStatus, 'in_progress' | 'successful'>;
      comment?: string;
      rejectionReason?: never;
    }
  | {
      status: 'rejected';
      rejectionReason: string;
      comment?: string;
    };

export type UpdateOrderStatusResponse = OrderDetailsResponse;
