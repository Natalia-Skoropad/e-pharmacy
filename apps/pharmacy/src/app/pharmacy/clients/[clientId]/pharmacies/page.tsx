import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ClientDetailsPageContent } from '@/components/clients/ClientDetailsPageContent';

//===================================================================

export const metadata: Metadata = { title: 'Client pharmacies' };

//===================================================================

export default async function ClientPharmaciesPage({
  params,
}: Readonly<{ params: Promise<{ clientId: string }> }>) {
  const { clientId } = await params;

  if (!isValidObjectId(clientId)) notFound();

  return (
    <ClientDetailsPageContent clientId={clientId} initialTab="pharmacies" />
  );
}
