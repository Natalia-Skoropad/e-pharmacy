import type { ApiPaginationResponse } from '../api';
import type { Cart } from '../cart';
import type { CalendarDateString } from '../primitives';
import type { Order, OrderManagerComment } from './client-order';
import type { OrderStatisticsCounts } from './order-statistics';

//=============================================================================

export type ClientOrdersResponse = ApiPaginationResponse<Order> & {
  statistics: OrderStatisticsCounts;
  earliestCreatedAt: CalendarDateString | null;
};

export type CheckoutOrderResponse = { order: Order; cart: Cart };
export type OrderDetailsResponse = { order: Order };

export type OrderManagerCommentsResponse =
  ApiPaginationResponse<OrderManagerComment>;

export type CreateOrderManagerCommentResponse = {
  comment: OrderManagerComment;
};
