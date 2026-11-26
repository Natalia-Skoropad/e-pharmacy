import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import type { ProductRequestRowViewModel } from '@/lib/product-requests/product-requests';

import { getProductRequestCancellationLabel } from './ProductRequestDetailsPageContent/product-request-status-activity';

//===================================================================

/** Keep the registry and detail view on the same saved status contract. */
export function ProductRequestStatusBadges({
  request,
}: Readonly<{
  request: Pick<
    ProductRequestRowViewModel,
    'status' | 'reviewState' | 'cancelledBy'
  >;
}>) {
  const cancellationLabel = getProductRequestCancellationLabel(request);

  return (
    <>
      <StatusBadge {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]} />
      {request.status === 'on_moderation' &&
      request.reviewState === 'changes_requested' ? (
        <StatusBadge label="Needs changes" tone="neutral" />
      ) : null}
      {cancellationLabel ? (
        <StatusBadge label={cancellationLabel} tone="neutral" />
      ) : null}
    </>
  );
}
