import type { OrderStatus } from './status';

//=============================================================================

export type UpdateOrderStatusPayload =
  | {
      status: Extract<OrderStatus, 'in_progress' | 'successful'>;
      comment?: string;
      rejectionReason?: never;
    }
  | {
      status: 'rejected';
      rejectionReason: string;
      comment?: string;
    };

//=============================================================================

export type CreateOrderManagerCommentPayload = { text: string };
