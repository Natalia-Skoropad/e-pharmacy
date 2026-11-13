'use client';

import { OrdersPageContent } from '@/components/orders/OrdersPageContent';

//===================================================================

/** The same Orders registry, scoped server-side to one product. All filters,
 * statistics, suggestions and pagination share the established Orders UI. */
export function OwnProductRelatedOrdersTab({
  productId,
}: Readonly<{ productId: string }>) {
  return <OrdersPageContent relatedProductId={productId} />;
}
