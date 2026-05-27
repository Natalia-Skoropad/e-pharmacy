import { ProtectedRoute } from '@/routes';
import { OrderDetailsPageContent } from '@/components/profile';

import {
  ORDER_DETAILS_DESCRIPTION,
  ORDER_DETAILS_TITLE,
} from '@/lib/constants/metadata';

import { ROUTES } from '@/lib/constants/routes';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

type OrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

//===================================================================

export const metadata = createPageMetadata({
  title: ORDER_DETAILS_TITLE,
  description: ORDER_DETAILS_DESCRIPTION,
  path: `${ROUTES.PROFILE}/orders`,
  noIndex: true,
});

//===================================================================

async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;

  return (
    <ProtectedRoute>
      <OrderDetailsPageContent orderId={orderId} />
    </ProtectedRoute>
  );
}

export default OrderDetailsPage;
