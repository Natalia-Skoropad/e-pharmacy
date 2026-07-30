import { notFound } from 'next/navigation';

import {
  ORDER_DETAILS_DESCRIPTION,
  ORDER_DETAILS_TITLE,
  createPageMetadata,
} from '@/lib/seo/server';

import { getOrderIdFromPathParam, ROUTES } from '@/lib/routes';
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
    path: cleanOrderId
      ? `${ROUTES.PROFILE}/orders/${orderId}`
      : ROUTES.PROFILE,
    noIndex: true,
  });
}

//===================================================================

async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const cleanOrderId = getOrderIdFromPathParam(orderId);

  if (!cleanOrderId) notFound();

  return <OrderDetailsPageContent orderId={cleanOrderId} />;
}

export default OrderDetailsPage;
