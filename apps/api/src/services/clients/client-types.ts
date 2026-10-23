import type { Types } from 'mongoose';

import type { ProductStatus } from '../../types/product';
import type { ProductCategorySnapshotDto } from '../../types/product-category';
import type { PharmacyEntity } from '../../types/pharmacy';

//===============================================================

export type PharmacyDocument = PharmacyEntity & { _id: Types.ObjectId };

//===============================================================

export type ClientRow = Readonly<{
  id: string;
  photoUrl: string | null;
  firstOrderAt: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  successfulOrdersCount: number;
  successfulOrdersAmount: number;
  status: 'active' | 'blocked';
  statusReason?: string;
  isDefault: boolean;
}>;

export type ClientStatistics = Readonly<{
  total: number;
  repeat: number;
  active: number;
  blocked: number;
}>;

export type AggregatedClientRow = Omit<ClientRow, 'firstOrderAt'> & {
  firstOrderAt: Date;
  earliestOrderAt: Date | null;
};

export type ClientAggregationResult = Readonly<{
  items: AggregatedClientRow[];
  total: Array<{ count: number }>;

  statistics: Array<
    ClientStatistics & {
      earliestOrderAt: Date | null;
    }
  >;
}>;

export type ClientPurchasedProductRow = Readonly<{
  id: string;
  firstOrderDate: string;
  productId: string;
  photoUrl: string | null;
  article: string;
  name: string;
  category?: ProductCategorySnapshotDto;
  quantity: number;
  totalAmount: number;
  ordersCount: number;
  currentProductExists: boolean;
  currentStatus: ProductStatus | null;
}>;

export type AggregatedClientPurchasedProductRow = Omit<
  ClientPurchasedProductRow,
  'firstOrderDate' | 'category'
> & {
  firstOrderDate: Date;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export type ClientPurchasedProductsAggregationResult = Readonly<{
  items: AggregatedClientPurchasedProductRow[];
  total: Array<{ count: number }>;
  metadata: Array<{ earliestCreatedAt: Date }>;
}>;
