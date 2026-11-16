import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Order details',
  description: 'View and update an order.',
};

//===================================================================

export default async function OrderDetailsPage({
  params,
}: Readonly<{ params: Promise<{ orderSegment: string }> }>) {
  const { orderSegment } = await params;
  const match = /^order-id-([a-f0-9]{24})$/i.exec(orderSegment);

  if (!match) notFound();

  const orderId = match[1]!.toLowerCase();

  return <OrderDetailsPageContent key={orderId} orderId={orderId} />;
}
