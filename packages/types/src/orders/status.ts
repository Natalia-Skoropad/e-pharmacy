export type OrderStatus = 'new' | 'in_progress' | 'successful' | 'rejected';

//=============================================================================

export type PaymentMethod = 'cash' | 'bank_transfer';

//=============================================================================

export type DeliveryMethod = 'pickup' | 'postal_delivery';

//=============================================================================

export type Currency = 'UAH';

//=============================================================================

export type OrderCreatedByType = 'client' | 'manager';

//=============================================================================

export type OrderActivityType =
  | 'product_added'
  | 'product_removed'
  | 'quantity_increased'
  | 'quantity_decreased';
