import type { ApiPaginationResponse } from '../api';
import type { Cart } from '../cart';
import type { CalendarDateString } from '../primitives';

import type {
  ClientOrder,
  OrderManagerCommentResponseDto,
} from './client-order';

import type { OrderStatisticsCounts } from './order-statistics';

//=============================================================================

export type ClientOrdersResponse = Readonly<
  ApiPaginationResponse<ClientOrder> & {
    statistics: OrderStatisticsCounts;
    earliestCreatedAt: CalendarDateString | null;
  }
>;

export type CheckoutOrderResponse = Readonly<{
  order: ClientOrder;
  cart: Cart;
}>;

export type ClientOrderDetailsResponse = Readonly<{
  order: ClientOrder;
}>;

export type OrderManagerCommentsResponse = Readonly<
  ApiPaginationResponse<OrderManagerCommentResponseDto>
>;

export type CreateOrderManagerCommentResponse = Readonly<{
  comment: OrderManagerCommentResponseDto;
}>;
