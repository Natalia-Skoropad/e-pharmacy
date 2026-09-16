import type { OrdersFilterState } from '@/lib/orders/orders-filters';

//===================================================================

export type OrdersTextFilterState = Readonly<
  Pick<OrdersFilterState, 'client' | 'orderNumber'>
>;

//===================================================================

export function getOrdersTextFilterState(
  filters: OrdersFilterState
): OrdersTextFilterState {
  return {
    client: filters.client,
    orderNumber: filters.orderNumber,
  };
}

//===================================================================

export function applyDebouncedOrdersTextFilters(
  filters: OrdersFilterState,
  debouncedTextFilters: OrdersTextFilterState
): OrdersFilterState {
  return {
    ...filters,
    date: { ...filters.date },
    client: debouncedTextFilters.client,
    orderNumber: debouncedTextFilters.orderNumber,
  };
}

//===================================================================

export function areOrdersFiltersEqual(
  left: OrdersFilterState,
  right: OrdersFilterState
): boolean {
  return (
    left.date.from === right.date.from &&
    left.date.to === right.date.to &&
    left.client === right.client &&
    left.orderNumber === right.orderNumber &&
    left.deliveryMethod === right.deliveryMethod &&
    left.paymentMethod === right.paymentMethod &&
    left.status === right.status &&
    left.createdByType === right.createdByType
  );
}

//===================================================================

export function syncOrdersFiltersFromRoute(
  currentFilters: OrdersFilterState,
  routeFilters: OrdersFilterState
): OrdersFilterState {
  if (areOrdersFiltersEqual(currentFilters, routeFilters)) {
    return currentFilters;
  }

  return {
    ...routeFilters,
    date: { ...routeFilters.date },
  };
}
