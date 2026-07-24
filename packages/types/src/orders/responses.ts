import type { ApiPaginationResponse } from '../api';
import type { Cart } from '../cart';
import type { CalendarDateString } from '../primitives';
import type { Order, OrderManagerComment } from './client-order';
import type { OrderStatisticsCounts } from './order-statistics';

//=============================================================================

export type ClientOrdersResponse = Readonly<
  ApiPaginationResponse<Order> & {
    statistics: OrderStatisticsCounts;
    earliestCreatedAt: CalendarDateString | null;
  }
>;

export type CheckoutOrderResponse = Readonly<{ order: Order; cart: Cart }>;
export type OrderDetailsResponse = Readonly<{ order: Order }>;

export type OrderManagerCommentsResponse = Readonly<
  ApiPaginationResponse<OrderManagerComment>
>;

export type CreateOrderManagerCommentResponse = Readonly<{
  comment: OrderManagerComment;
}>;
