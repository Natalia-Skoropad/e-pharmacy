/**
 * Backend-owned cancellation reasons. The API keeps its own reason catalog
 * to preserve backend/frontend package boundaries.
 * Keep these codes and labels synchronized with the public client contract;
 * scripts/checks/config/check-config-contracts.mjs verifies parity.
 */
type OrderCancellationReason = Readonly<{
  code: string;
  label: string;
}>;

//===============================================================

export const CLIENT_ORDER_CANCEL_REASONS: readonly OrderCancellationReason[] = [
  { code: 'ordered_elsewhere', label: 'Ordered from another pharmacy' },
  { code: 'price_too_high', label: 'Product price is too high' },
  { code: 'ordered_by_mistake', label: 'Placed the order by mistake' },
  { code: 'no_longer_needed', label: 'Products are no longer needed' },
  {
    code: 'delivery_not_suitable',
    label: 'Delivery or pickup terms do not work for me',
  },
  { code: 'other', label: 'Other reason' },
];

//===============================================================

export const MANAGER_ORDER_CANCEL_REASONS: readonly OrderCancellationReason[] =
  [
    { code: 'customer_requested', label: 'Customer requested cancellation' },
    { code: 'stock_unavailable', label: 'Required products are unavailable' },
    { code: 'customer_unreachable', label: 'Could not contact the customer' },
    { code: 'duplicate_order', label: 'Duplicate order created' },
    {
      code: 'fulfillment_unavailable',
      label: 'Cannot fulfill the requested delivery or pickup',
    },
    { code: 'other', label: 'Other reason' },
  ];

//===============================================================

export function findReasonCode(
  reason: string,
  options: readonly OrderCancellationReason[]
): string {
  return (
    options.find((option) => option.label === reason.trim())?.code ?? 'other'
  );
}
