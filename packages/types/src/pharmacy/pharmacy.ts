import type { AuthUser } from '../auth';
import type { EntityId, ISODateString } from '../shared';
import type { Product, ProductOffer } from '../products';
import type { Pharmacy as BasePharmacyDto } from '../pharmacies';
import type { OrderStatus } from '../orders';
import type { PharmacyStatus } from '../auth';

//=============================================================================

export type PharmacyProfileDto = BasePharmacyDto & {
  ownerId: EntityId;
  status: PharmacyStatus;
  createdAt?: ISODateString;
  approvedBy?: EntityId;
  approvedAt?: ISODateString;
};

export type ProductOfferDto = Product & {
  ownedOffer: ProductOffer;
};

export type PharmacyStatisticsDto = {
  totalProducts: number;
  activeProducts: number;
  reservedItems: number;
  ordersCount: number;
  revenue: number;
};

export type ClientGoodsDto = {
  orderId: EntityId;
  productId: EntityId;
  productName: string;
  quantity: number;
  clientName?: string;
  status: OrderStatus;
  createdAt: ISODateString;
};

export type PharmacyUser = AuthUser;

export type ProductRequestStatus =
  | 'draft'
  | 'on_moderation'
  | 'approved'
  | 'rejected';

export type ProductRequest = {
  id: EntityId;
  productId?: EntityId;
  productName: string;
  status: ProductRequestStatus;
  createdAt: ISODateString;
};
