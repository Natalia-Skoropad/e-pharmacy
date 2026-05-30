import type { EntityId, ISODateString } from './base';
import type { ProductDto, ProductOfferDto } from './product';
import type { StoreDto } from './store';
import type { OrderStatus } from './order';
import type { ShopStatus } from './auth';

//=============================================================================

export type VendorShopDto = StoreDto & {
  ownerId: EntityId;
  status: ShopStatus;
  createdAt?: ISODateString;
  approvedBy?: EntityId;
  approvedAt?: ISODateString;
};

export type VendorProductDto = ProductDto & {
  ownedOffer: ProductOfferDto;
};

export type VendorStatisticsDto = {
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
  customerName?: string;
  status: OrderStatus;
  createdAt: ISODateString;
};
