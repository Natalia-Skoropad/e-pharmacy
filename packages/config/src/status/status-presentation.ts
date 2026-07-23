import type { UserStatus } from '@e-pharmacy/types/auth';
import type { OrderStatus } from '@e-pharmacy/types/orders';
import type { PharmacyStatus } from '@e-pharmacy/types/pharmacies';
import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';
import type { ProductStatus } from '@e-pharmacy/types/products';

//===================================================================

export type StatusTone =
  | 'blue'
  | 'yellow'
  | 'green'
  | 'red'
  | 'gray'
  | 'beauty';

//===================================================================

export type StatusPresentation = Readonly<{
  label: string;
  tone: StatusTone;
}>;

//===================================================================

export const ORDER_STATUS_PRESENTATION: Readonly<
  Record<OrderStatus, StatusPresentation>
> = {
  new: { label: 'New', tone: 'blue' },
  in_progress: { label: 'In progress', tone: 'yellow' },
  successful: { label: 'Successful', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
};

//===================================================================

export const PHARMACY_STATUS_PRESENTATION: Readonly<
  Record<PharmacyStatus, StatusPresentation>
> = {
  new: { label: 'New', tone: 'blue' },
  on_verification: { label: 'On verification', tone: 'beauty' },
  on_moderation: { label: 'On moderation', tone: 'yellow' },
  active: { label: 'Active', tone: 'green' },
  blocked: { label: 'Blocked', tone: 'red' },
};

//===================================================================

export const PRODUCT_REQUEST_STATUS_PRESENTATION: Readonly<
  Record<ProductRequestStatus, StatusPresentation>
> = {
  draft: { label: 'Draft', tone: 'gray' },
  new: { label: 'New', tone: 'blue' },
  in_progress: { label: 'In work', tone: 'yellow' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
};

//===================================================================

export const PRODUCT_STATUS_PRESENTATION: Readonly<
  Record<ProductStatus, StatusPresentation>
> = {
  new: { label: 'New', tone: 'blue' },
  active: { label: 'Active', tone: 'green' },
  blocked: { label: 'Blocked', tone: 'red' },
};

//===================================================================

export const USER_STATUS_PRESENTATION: Readonly<
  Record<UserStatus, StatusPresentation>
> = {
  active: { label: 'Active', tone: 'green' },
  blocked: { label: 'Blocked', tone: 'red' },
};

//===================================================================

const STATUS_PRESENTATION_BY_VALUE: Readonly<
  Record<string, StatusPresentation>
> = {
  ...ORDER_STATUS_PRESENTATION,
  ...PHARMACY_STATUS_PRESENTATION,
  ...PRODUCT_REQUEST_STATUS_PRESENTATION,
  ...PRODUCT_STATUS_PRESENTATION,
  ...USER_STATUS_PRESENTATION,
};

//===================================================================

export function getStatusPresentation(
  status: string,
  fallbackLabel?: string
): StatusPresentation {
  return (
    STATUS_PRESENTATION_BY_VALUE[status] ?? {
      label: fallbackLabel ?? status,
      tone: 'gray',
    }
  );
}
