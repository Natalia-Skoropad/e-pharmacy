import type { ClientStatisticsCounts } from '@e-pharmacy/config/clients';

import type {
  OrderSalesStatistics,
  OrderStatisticsCounts,
} from '@e-pharmacy/types/orders';

import type {
  AllProductStatisticsCounts,
  OwnProductStatisticsCounts,
} from '@e-pharmacy/types/products';

//===================================================================

export const DEFAULT_CLIENT_STATISTICS: ClientStatisticsCounts = {
  total: 0,
  repeat: 0,
  active: 0,
  blocked: 0,
};

//===================================================================

export const DEFAULT_ORDER_STATISTICS: OrderStatisticsCounts = {
  new: { count: 0, amount: 0 },
  in_progress: { count: 0, amount: 0 },
  successful: { count: 0, amount: 0 },
  rejected: { count: 0, amount: 0 },
};

//===================================================================

export const DEFAULT_ORDER_SALES_STATISTICS: OrderSalesStatistics = {
  currency: 'UAH',
  groupBy: 'month',
  categories: [],
  points: [],
};

//===================================================================

export const DEFAULT_ALL_PRODUCT_STATISTICS: AllProductStatisticsCounts = {
  active: 0,
  blocked: 0,
  addedToPharmacy: 0,
  notAddedToPharmacy: 0,
};

//===================================================================

export const DEFAULT_OWN_PRODUCT_STATISTICS: OwnProductStatisticsCounts = {
  inStock: { quantity: 0, amount: 0 },
  reserved: { quantity: 0, amount: 0 },
  available: { quantity: 0, amount: 0 },
  outOfStock: { quantity: 0 },
};
