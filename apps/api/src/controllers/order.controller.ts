import type { Request } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';

import type {
  CheckoutOrderInput,
  CreateManagerOrderInput,
  CreateOrderManagerCommentInput,
  OrderCommentParams,
  OrderCommentsQuery,
  OrderParams,
  OrdersQuery,
  OrderSalesStatisticsQuery,
  UpdateOrderDetailsInput,
  UpdateOrderStatusInput,
} from '../schemas/order.schema';

import {
  checkoutOrderService,
  createManagerOrderService,
  createOrderManagerCommentService,
  deleteOrderManagerCommentService,
  getOrderByIdService,
  getOrderManagerCommentsService,
  getOrderSalesStatisticsService,
  getOrdersService,
  updateOrderDetailsService,
  updateOrderStatusService,
} from '../services/order.service';

import type { ValidatedResponse } from '../types/validated-request';
import { sendSuccessResponse } from '../utils/apiResponse';

//===============================================================

export async function checkoutOrder(
  req: Request,
  res: ValidatedResponse<CheckoutOrderInput>
): Promise<void> {
  const { body } = res.locals.validated;
  const data = await checkoutOrderService(req.user?.id ?? '', body);
  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function createManagerOrder(
  req: Request,
  res: ValidatedResponse<CreateManagerOrderInput>
): Promise<void> {
  const { body } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await createManagerOrderService(
    { id: user.id, role: user.role },
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function getOrders(
  req: Request,
  res: ValidatedResponse<unknown, unknown, OrdersQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getOrdersService(req.user?.id ?? '', query, req.user?.role);

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOrderSalesStatistics(
  req: Request,
  res: ValidatedResponse<unknown, unknown, OrderSalesStatisticsQuery>
): Promise<void> {
  const { query } = res.locals.validated;
  const data = await getOrderSalesStatisticsService(
    req.user?.id ?? '',
    query,
    req.user?.role
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOrderById(
  req: Request,
  res: ValidatedResponse<unknown, OrderParams>
): Promise<void> {
  const { orderId } = res.locals.validated.params;
  const data = await getOrderByIdService(
    req.user?.id ?? '',
    orderId,
    req.user?.role
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function getOrderManagerComments(
  req: Request,
  res: ValidatedResponse<unknown, OrderParams, OrderCommentsQuery>
): Promise<void> {
  const { params, query } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await getOrderManagerCommentsService(
    { id: user.id, role: user.role },
    params.orderId,
    query
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function createOrderManagerComment(
  req: Request,
  res: ValidatedResponse<CreateOrderManagerCommentInput, OrderParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await createOrderManagerCommentService(
    { id: user.id, role: user.role },
    params.orderId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.CREATED, data });
}

//===============================================================

export async function deleteOrderManagerComment(
  req: Request,
  res: ValidatedResponse<unknown, OrderCommentParams>
): Promise<void> {
  const { orderId, commentId } = res.locals.validated.params;
  const user = req.user;
  if (!user) return;

  const data = await deleteOrderManagerCommentService(
    { id: user.id, role: user.role },
    orderId,
    commentId
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateOrderDetails(
  req: Request,
  res: ValidatedResponse<UpdateOrderDetailsInput, OrderParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await updateOrderDetailsService(
    { id: user.id, role: user.role },
    params.orderId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}

//===============================================================

export async function updateOrderStatus(
  req: Request,
  res: ValidatedResponse<UpdateOrderStatusInput, OrderParams>
): Promise<void> {
  const { body, params } = res.locals.validated;
  const user = req.user;
  if (!user) return;

  const data = await updateOrderStatusService(
    { id: user.id, role: user.role },
    params.orderId,
    body
  );

  sendSuccessResponse({ res, statusCode: HTTP_STATUS.OK, data });
}
