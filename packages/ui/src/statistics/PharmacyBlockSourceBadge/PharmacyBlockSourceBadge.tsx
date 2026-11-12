import { StatusBadge } from '../StatusBadge';

//===================================================================

/** Provenance is independent from the pharmacy's Blocked lifecycle status. */
export function PharmacyBlockSourceBadge({
  status,
  blockSource,
}: Readonly<{
  status: string;
  blockSource?: 'owner_deactivated' | 'admin_blocked' | null;
}>) {
  // Unknown provenance is not a user-facing status: show no second badge.
  if (
    status !== 'blocked' ||
    (blockSource !== 'owner_deactivated' && blockSource !== 'admin_blocked')
  )
    return null;

  return (
    <StatusBadge
      label={
        blockSource === 'owner_deactivated'
          ? 'Blocked by owner'
          : 'Blocked by admin'
      }
      tone="neutral"
    />
  );
}
