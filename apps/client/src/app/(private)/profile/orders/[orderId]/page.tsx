import { notFound, permanentRedirect } from 'next/navigation';

import {
  ORDER_DETAILS_DESCRIPTION,
  ORDER_DETAILS_TITLE,
  PROFILE_TITLE,
  PROFILE_DESCRIPTION,
  createPageMetadata,
} from '@/lib/seo/server';

import {
  getLegacyOrderRedirectPath,
  getOrderIdFromPathParam,
  ROUTES,
} from '@/lib/routes';

import { isClientOrdersFilterSegment } from '@/lib/profile/client-orders-url';

import {
  OrderDetailsPageContent,
  ProfilePageContent,
} from '@/components/profile';

//===================================================================

type OrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

//===================================================================

export async function generateMetadata({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;

  if (isClientOrdersFilterSegment(orderId)) {
    return createPageMetadata({
      title: PROFILE_TITLE,
      description: PROFILE_DESCRIPTION,
      path: `${ROUTES.PROFILE}/orders/${orderId}`,
      noIndex: true,
    });
  }

  const cleanOrderId = getOrderIdFromPathParam(orderId);

  return createPageMetadata({
    title: ORDER_DETAILS_TITLE,
    description: ORDER_DETAILS_DESCRIPTION,
    path: cleanOrderId ? `${ROUTES.PROFILE}/orders/${orderId}` : ROUTES.PROFILE,
    noIndex: true,
  });
}

//===================================================================

async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  if (isClientOrdersFilterSegment(orderId)) return <ProfilePageContent />;
  const legacyRedirectPath = getLegacyOrderRedirectPath(orderId);

  if (legacyRedirectPath) permanentRedirect(legacyRedirectPath);

  const cleanOrderId = getOrderIdFromPathParam(orderId);
  if (!cleanOrderId) notFound();

  return <OrderDetailsPageContent orderId={cleanOrderId} />;
}

export default OrderDetailsPage;
