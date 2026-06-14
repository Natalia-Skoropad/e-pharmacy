import type { AuthUser } from '../auth';
import type { EntityId, ISODateString } from '../shared';
import type { ProductDto, ProductOfferDto } from '../products';
import type { StoreDto } from '../stores';
import type { OrderStatus } from '../orders';
import type { ShopStatus } from '../auth';

//=============================================================================

export type PharmacyShopDto = StoreDto & {
  ownerId: EntityId;
  status: ShopStatus;
  createdAt?: ISODateString;
  approvedBy?: EntityId;
  approvedAt?: ISODateString;
};

export type PharmacyProductDto = ProductDto & {
  ownedOffer: ProductOfferDto;
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

export type Pharmacy = AuthUser;

export type ProductRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type ProductRequest = {
  id: EntityId;
  productId?: EntityId;
  productName: string;
  status: ProductRequestStatus;
  createdAt: ISODateString;
};
