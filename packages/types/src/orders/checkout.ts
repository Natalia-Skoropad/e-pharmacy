import type { EntityId } from '../primitives';
import type { PaymentMethod } from './status';

//=============================================================================

type CheckoutConcurrencyContract = Readonly<{
  expectedCartRevision: number;
  groupFingerprint: string;
}>;

//=============================================================================

export type CheckoutOrderPayload =
  | (CheckoutConcurrencyContract & {
      pharmacyId: EntityId;
      paymentMethod: PaymentMethod;
      deliveryMethod: 'pickup';
      deliveryDetails?: never;
      comment?: string;
    })
  | (CheckoutConcurrencyContract & {
      pharmacyId: EntityId;
      paymentMethod: PaymentMethod;
      deliveryMethod: 'postal_delivery';
      deliveryDetails: {
        recipientName: string;
        recipientPhone: string;
        address: string;
      };
      comment?: string;
    });
