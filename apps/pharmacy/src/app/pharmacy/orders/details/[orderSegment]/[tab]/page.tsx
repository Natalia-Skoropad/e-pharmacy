import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PHARMACY_ORDER_TAB_SEGMENTS } from '@/lib/routes';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Order details',
  description: 'View and update an order.',
};

//===================================================================

export default async function OrderDetailTabPage({
  params,
}: Readonly<{
  params: Promise<{ orderSegment: string; tab: string }>;
}>) {
  const { orderSegment, tab } = await params;
  const match = /^order-id-([a-f0-9]{24})$/i.exec(orderSegment);

  if (!match || !Object.values(PHARMACY_ORDER_TAB_SEGMENTS).includes(tab))
    notFound();

  const orderId = match[1]!.toLowerCase();

  return <OrderDetailsPageContent key={orderId} orderId={orderId} />;
}
