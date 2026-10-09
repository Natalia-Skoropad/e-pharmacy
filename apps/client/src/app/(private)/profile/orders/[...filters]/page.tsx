import { notFound } from 'next/navigation';

import { isClientOrdersFilterSegment } from '@/lib/profile/client-orders-url';

import { ProfilePageContent } from '@/components/profile';

//===================================================================

export { metadata } from '../../page';

//===================================================================

export default async function ClientFilteredOrdersPage({
  params,
}: Readonly<{ params: Promise<{ filters: string[] }> }>) {
  const { filters } = await params;

  if (!filters.length || !filters.every(isClientOrdersFilterSegment))
    notFound();

  return <ProfilePageContent />;
}
