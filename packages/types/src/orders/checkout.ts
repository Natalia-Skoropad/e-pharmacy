import type { EntityId } from '../primitives';
import type { PaymentMethod } from './status';

//=============================================================================

export type CheckoutOrderPayload =
  | {
      pharmacyId: EntityId;
      paymentMethod: PaymentMethod;
      deliveryMethod: 'pickup';
      deliveryDetails?: never;
      comment?: string;
    }
  | {
      pharmacyId: EntityId;
      paymentMethod: PaymentMethod;
      deliveryMethod: 'postal_delivery';
      deliveryDetails: {
        recipientName: string;
        recipientPhone: string;
        address: string;
      };
      comment?: string;
    };
