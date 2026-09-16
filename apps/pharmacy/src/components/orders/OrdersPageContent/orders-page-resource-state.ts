import type { OrderStatisticsCounts } from '@e-pharmacy/types/orders';

import type {
  PharmacyOrderRow,
  PharmacyOrdersResponse,
} from '@/lib/orders/orders';

import { DEFAULT_ORDER_STATISTICS } from '@/lib/statistics/defaults';

//===================================================================

export type OrdersStatus = 'loading' | 'success' | 'error';

//===================================================================

export type OrdersPageResourceState = Readonly<{
  status: OrdersStatus;
  orders: PharmacyOrderRow[];
  totalOrders: number;
  totalPages: number;
  earliestCreatedAt: string | null;
  statistics: OrderStatisticsCounts;
  errorMessage: string;
}>;

//===================================================================

export const INITIAL_ORDERS_PAGE_RESOURCE_STATE: OrdersPageResourceState = {
  status: 'loading',
  orders: [],
  totalOrders: 0,
  totalPages: 0,
  earliestCreatedAt: null,
  statistics: DEFAULT_ORDER_STATISTICS,
  errorMessage: '',
};

//===================================================================

export function beginOrdersLoad(
  state: OrdersPageResourceState
): OrdersPageResourceState {
  return {
    ...state,
    status: 'loading',
    errorMessage: '',
  };
}

//===================================================================

export function completeOrdersLoad(
  response: PharmacyOrdersResponse
): OrdersPageResourceState {
  return {
    status: 'success',
    orders: [...response.items],
    totalOrders: response.total,
    totalPages: response.totalPages,
    earliestCreatedAt: response.earliestCreatedAt,
    statistics: response.statistics,
    errorMessage: '',
  };
}

//===================================================================

export function failOrdersLoad(
  state: OrdersPageResourceState,
  errorMessage: string
): OrdersPageResourceState {
  return {
    ...state,
    status: 'error',
    errorMessage,
  };
}
