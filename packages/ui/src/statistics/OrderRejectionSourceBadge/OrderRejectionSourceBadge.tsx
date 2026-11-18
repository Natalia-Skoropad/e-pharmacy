import { StatusBadge } from '../StatusBadge';

//===================================================================

/** Rejection provenance is an independent detail, not an order status. */
export function OrderRejectionSourceBadge({
  status,
  rejectedByType,
}: Readonly<{
  status: string;
  rejectedByType?: 'manager' | 'client' | null;
}>) {
  if (status !== 'rejected' || !rejectedByType) return null;

  return (
    <StatusBadge
      label={
        rejectedByType === 'manager'
          ? 'Cancelled by manager'
          : 'Cancelled by client'
      }
      tone="neutral"
    />
  );
}
