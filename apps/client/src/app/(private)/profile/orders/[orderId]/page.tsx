import { OrderDetailsPageContent } from '@/components/profile';

import {
  ORDER_DETAILS_DESCRIPTION,
  ORDER_DETAILS_TITLE,
} from '@e-pharmacy/config/seo';

import { ROUTES } from '@e-pharmacy/config/routes';
import { createPageMetadata } from '@/lib/seo';

import { ProtectedRoute } from '@/routes';

//===================================================================

type OrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

//===================================================================

export async function generateMetadata({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;

  return createPageMetadata({
    title: ORDER_DETAILS_TITLE,
    description: ORDER_DETAILS_DESCRIPTION,
    path: `${ROUTES.PROFILE}/orders/${orderId}`,
    noIndex: true,
  });
}

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
