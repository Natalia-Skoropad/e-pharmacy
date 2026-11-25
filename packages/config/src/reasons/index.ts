// Stable reason codes are suitable for future reporting; labels are UI copy.
export type ReasonOption = Readonly<{ code: string; label: string }>;

//===================================================================

export const CLIENT_ORDER_CANCEL_REASONS: readonly ReasonOption[] = [
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

//===================================================================

export const MANAGER_ORDER_CANCEL_REASONS: readonly ReasonOption[] = [
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

//===================================================================

export const OWNER_PHARMACY_BLOCK_REASONS: readonly ReasonOption[] = [
  { code: 'temporary_closure', label: 'Pharmacy is temporarily closed' },
  { code: 'staffing_shortage', label: 'Insufficient staff to operate' },
  { code: 'inventory_pause', label: 'Stock reconciliation in progress' },
  { code: 'relocation', label: 'Pharmacy is relocating' },
  { code: 'maintenance', label: 'Facility maintenance or repairs' },
  { code: 'other', label: 'Other reason' },
];

//===================================================================

export const ADMIN_PHARMACY_BLOCK_REASONS: readonly ReasonOption[] = [
  {
    code: 'invalid_documents',
    label: 'Required verification documents are invalid',
  },
  {
    code: 'licensing_issue',
    label: 'Licensing or regulatory requirements not met',
  },
  {
    code: 'incorrect_business_details',
    label: 'Business or payment information is inaccurate',
  },
  {
    code: 'unsafe_listing',
    label: 'Product listing or dispensing safety concern',
  },
  {
    code: 'repeated_policy_violations',
    label: 'Repeated marketplace policy violations',
  },
  { code: 'other', label: 'Other reason' },
];

//===================================================================

export const OWNER_PRODUCT_REQUEST_CANCEL_REASONS: readonly ReasonOption[] = [
  { code: 'no_longer_needed', label: 'The product is no longer needed' },
  {
    code: 'duplicate_request',
    label: 'The product request was created by mistake or duplicated',
  },
  {
    code: 'documents_unavailable',
    label: 'Required supporting documents are unavailable',
  },
  {
    code: 'cannot_correct',
    label: 'Unable to provide the requested corrections',
  },
  {
    code: 'product_unavailable',
    label: 'The product or supplier is no longer available',
  },
  { code: 'other', label: 'Other reason' },
];

//===================================================================

export const ADMIN_PRODUCT_REQUEST_REJECTION_REASONS: readonly ReasonOption[] =
  [
    {
      code: 'invalid_documents',
      label: 'Supporting documents are missing or invalid',
    },
    {
      code: 'incorrect_product_data',
      label: 'Product information does not match the packaging or documents',
    },
    {
      code: 'duplicate_product',
      label: 'Product already exists in the catalog',
    },
    {
      code: 'regulatory_requirements',
      label: 'Product does not meet legal or regulatory requirements',
    },
    {
      code: 'unsafe_product',
      label: 'Product does not meet marketplace safety or quality requirements',
    },
    { code: 'other', label: 'Other reason' },
  ];

//===================================================================

export const ADMIN_OWNER_BLOCK_REASONS: readonly ReasonOption[] = [
  {
    code: 'identity_verification',
    label: 'Owner identity or documents could not be verified',
  },
  {
    code: 'security_concern',
    label: 'Account security concern or unauthorized access',
  },
  {
    code: 'repeated_violations',
    label: 'Repeated violations of platform requirements',
  },
  { code: 'fraud_risk', label: 'Suspected fraudulent business activity' },
  {
    code: 'legal_restriction',
    label: 'Legal or regulatory restriction on operating',
  },
  { code: 'other', label: 'Other reason' },
];

//===================================================================

export function findReasonCode(
  reason: string,
  options: readonly ReasonOption[]
): string {
  return (
    options.find((option) => option.label === reason.trim())?.code ?? 'other'
  );
}
