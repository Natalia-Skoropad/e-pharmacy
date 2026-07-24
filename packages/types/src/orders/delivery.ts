export type Delivery =
  | Readonly<{ method: 'pickup'; details?: never }>
  | Readonly<{
      method: 'postal_delivery';
      details: Readonly<{
        recipientName: string;
        recipientPhone: string;
        address: string;
      }>;
    }>;
