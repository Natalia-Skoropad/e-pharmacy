export type Delivery =
  | { method: 'pickup'; details?: never }
  | {
      method: 'postal_delivery';
      details: {
        recipientName: string;
        recipientPhone: string;
        address: string;
      };
    };
