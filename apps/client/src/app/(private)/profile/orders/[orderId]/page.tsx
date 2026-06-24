import { notFound } from 'next/navigation';

import {
  ORDER_DETAILS_DESCRIPTION,
  ORDER_DETAILS_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { getOrderIdFromPathParam, isValidObjectId, ROUTES } from '@/lib/routes';
import { ProtectedRoute } from '@/routes';

import { OrderDetailsPageContent } from '@/components/profile';

//===================================================================

type OrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

//===================================================================

export async function generateMetadata({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const cleanOrderId = getOrderIdFromPathParam(orderId);

  return createPageMetadata({
    title: ORDER_DETAILS_TITLE,
    description: ORDER_DETAILS_DESCRIPTION,
    path: `${ROUTES.PROFILE}/orders/${cleanOrderId}`,
    noIndex: true,
  });
}

//===================================================================

async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const cleanOrderId = getOrderIdFromPathParam(orderId);

  if (!isValidObjectId(cleanOrderId)) notFound();

  return (
    <ProtectedRoute>
      <OrderDetailsPageContent orderId={cleanOrderId} />
    </ProtectedRoute>
  );
}

export default OrderDetailsPage;
